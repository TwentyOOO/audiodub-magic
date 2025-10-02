import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SynthesizeRequest {
  projectId: string;
  targetLanguage: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, targetLanguage }: SynthesizeRequest = await req.json();

    if (!projectId || !targetLanguage) {
      throw new Error("Missing required parameters");
    }

    const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!elevenLabsKey) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Synthesize] Starting synthesis for project: ${projectId}`);

    // Fetch all transcriptions with translations
    const { data: transcriptions, error: fetchError } = await supabase
      .from("transcriptions")
      .select("*, speaker_id")
      .eq("project_id", projectId)
      .order("start_time", { ascending: true });

    if (fetchError) throw fetchError;

    if (!transcriptions || transcriptions.length === 0) {
      throw new Error("No transcriptions found");
    }

    console.log(`[Synthesize] Synthesizing ${transcriptions.length} segments...`);

    // Group by speaker
    const speakerSegments = new Map<string, Array<{ text: string; timestamp: number }>>();

    for (const transcription of transcriptions) {
      if (!transcription.translated_text || !transcription.speaker_id) continue;

      const segments = speakerSegments.get(transcription.speaker_id) || [];
      segments.push({
        text: transcription.translated_text,
        timestamp: transcription.start_time,
      });
      speakerSegments.set(transcription.speaker_id, segments);
    }

    // Voice IDs for different speakers (using default ElevenLabs voices)
    const voiceIds = [
      "21m00Tcm4TlvDq8ikWAM", // Rachel
      "AZnzlk1XvdvUeBnXmlld", // Domi
      "EXAVITQu4vr4xnSDxMaL", // Bella
      "ErXwobaYiN019PkySvjV", // Antoni
      "MF3mGyEYCl7XYWbV9V6O", // Elli
    ];

    // Generate audio for each speaker
    const audioSegments: Array<{ audio: ArrayBuffer; timestamp: number }> = [];
    let speakerIndex = 0;

    for (const [speakerId, segments] of speakerSegments) {
      const voiceId = voiceIds[speakerIndex % voiceIds.length];
      speakerIndex++;

      console.log(`[Synthesize] Processing speaker ${speakerId} with voice ${voiceId}`);

      for (const segment of segments) {
        try {
          const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
              method: "POST",
              headers: {
                "xi-api-key": elevenLabsKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: segment.text,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                  stability: 0.5,
                  similarity_boost: 0.75,
                },
              }),
            }
          );

          if (!response.ok) {
            const error = await response.text();
            console.error(`[Synthesize] ElevenLabs error:`, error);
            continue;
          }

          const audioBuffer = await response.arrayBuffer();
          audioSegments.push({
            audio: audioBuffer,
            timestamp: segment.timestamp,
          });
        } catch (error) {
          console.error(`[Synthesize] Failed to synthesize segment:`, error);
        }
      }
    }

    if (audioSegments.length === 0) {
      throw new Error("No audio segments were generated");
    }

    console.log(`[Synthesize] Generated ${audioSegments.length} audio segments`);

    // Combine all audio segments into one file
    // For simplicity, we'll just concatenate them
    const totalLength = audioSegments.reduce((sum, seg) => sum + seg.audio.byteLength, 0);
    const combinedAudio = new Uint8Array(totalLength);
    let offset = 0;

    for (const segment of audioSegments) {
      combinedAudio.set(new Uint8Array(segment.audio), offset);
      offset += segment.audio.byteLength;
    }

    // Upload to Supabase Storage
    const fileName = `${projectId}/dubbed_audio_${Date.now()}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from("dubbed-files")
      .upload(fileName, combinedAudio.buffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("dubbed-files")
      .getPublicUrl(fileName);

    const dubbedAudioUrl = urlData.publicUrl;

    console.log(`[Synthesize] Upload completed: ${dubbedAudioUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        projectId,
        dubbedAudioUrl,
        segmentCount: audioSegments.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Synthesize] Error:", error);

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
