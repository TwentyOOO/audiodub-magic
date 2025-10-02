import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TranscribeRequest {
  projectId: string;
  audioFileUrl: string;
  sourceLanguage: string;
}

interface AssemblyAITranscript {
  id: string;
  status: string;
  utterances?: Array<{
    speaker: string;
    text: string;
    start: number;
    end: number;
  }>;
  text?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, audioFileUrl, sourceLanguage }: TranscribeRequest = await req.json();

    if (!projectId || !audioFileUrl) {
      throw new Error("Missing required parameters");
    }

    const assemblyAIKey = Deno.env.get("ASSEMBLYAI_API_KEY");
    if (!assemblyAIKey) {
      throw new Error("ASSEMBLYAI_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Transcribe] Starting transcription for project: ${projectId}`);

    // Submit audio for transcription with speaker diarization
    const submitResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: assemblyAIKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        audio_url: audioFileUrl,
        speaker_labels: true, // Enable speaker diarization
        language_code: sourceLanguage,
      }),
    });

    if (!submitResponse.ok) {
      const error = await submitResponse.text();
      throw new Error(`AssemblyAI submission failed: ${error}`);
    }

    const { id: transcriptId } = await submitResponse.json();
    console.log(`[Transcribe] Transcript submitted with ID: ${transcriptId}`);

    // Poll for completion
    let transcript: AssemblyAITranscript;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes timeout

    while (attempts < maxAttempts) {
      const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { authorization: assemblyAIKey },
      });

      if (!pollResponse.ok) {
        throw new Error("Failed to poll transcription status");
      }

      transcript = await pollResponse.json();

      if (transcript.status === "completed") {
        break;
      } else if (transcript.status === "error") {
        throw new Error("Transcription failed");
      }

      // Wait 5 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error("Transcription timeout");
    }

    console.log("[Transcribe] Transcription completed, processing results...");

    // Process utterances and create speakers
    const speakerMap = new Map<string, string>();
    const transcriptions: any[] = [];

    if (transcript!.utterances) {
      // Group by speaker to calculate total duration
      const speakerDurations = new Map<string, number>();

      for (const utterance of transcript!.utterances) {
        const duration = utterance.end - utterance.start;
        const currentDuration = speakerDurations.get(utterance.speaker) || 0;
        speakerDurations.set(utterance.speaker, currentDuration + duration);
      }

      // Create speaker records
      const speakerNumbers = Array.from(new Set(transcript!.utterances.map(u => u.speaker))).sort();
      
      for (let i = 0; i < speakerNumbers.length; i++) {
        const speakerLabel = speakerNumbers[i];
        const totalDuration = Math.round(speakerDurations.get(speakerLabel) || 0);

        const { data: speaker, error } = await supabase
          .from("speakers")
          .insert({
            project_id: projectId,
            speaker_number: i + 1,
            total_duration: totalDuration,
          })
          .select()
          .single();

        if (error) throw error;
        speakerMap.set(speakerLabel, speaker.id);
      }

      // Create transcription records
      for (const utterance of transcript!.utterances) {
        transcriptions.push({
          project_id: projectId,
          speaker_id: speakerMap.get(utterance.speaker),
          original_text: utterance.text,
          start_time: utterance.start / 1000, // Convert to seconds
          end_time: utterance.end / 1000,
        });
      }
    } else {
      // No speaker diarization, create single speaker
      const { data: speaker, error } = await supabase
        .from("speakers")
        .insert({
          project_id: projectId,
          speaker_number: 1,
          total_duration: 0,
        })
        .select()
        .single();

      if (error) throw error;

      transcriptions.push({
        project_id: projectId,
        speaker_id: speaker.id,
        original_text: transcript!.text,
        start_time: 0,
        end_time: 0,
      });
    }

    // Insert all transcriptions
    const { error: transcriptionError } = await supabase
      .from("transcriptions")
      .insert(transcriptions);

    if (transcriptionError) throw transcriptionError;

    console.log(`[Transcribe] Created ${speakerMap.size} speakers and ${transcriptions.length} transcriptions`);

    return new Response(
      JSON.stringify({
        success: true,
        projectId,
        speakerCount: speakerMap.size,
        transcriptionCount: transcriptions.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Transcribe] Error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
