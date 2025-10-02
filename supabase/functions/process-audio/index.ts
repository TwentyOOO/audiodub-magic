import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessAudioRequest {
  projectId: string;
  audioFileUrl: string;
  sourceLanguage: string;
  targetLanguage: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, audioFileUrl, sourceLanguage, targetLanguage }: ProcessAudioRequest = await req.json();

    if (!projectId || !audioFileUrl || !sourceLanguage || !targetLanguage) {
      throw new Error("Missing required parameters");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Process Audio] Starting processing for project: ${projectId}`);

    // Update status to transcribing
    await supabase
      .from("projects")
      .update({ 
        status: "transcribing",
        processing_started_at: new Date().toISOString()
      })
      .eq("id", projectId);

    // Step 1: Transcribe audio and identify speakers
    console.log("[Process Audio] Step 1: Transcribing...");
    const transcribeResponse = await supabase.functions.invoke("transcribe", {
      body: { projectId, audioFileUrl, sourceLanguage },
    });

    if (transcribeResponse.error) {
      throw new Error(`Transcription failed: ${transcribeResponse.error.message}`);
    }

    console.log("[Process Audio] Transcription completed");

    // Update status to translating
    await supabase
      .from("projects")
      .update({ status: "translating" })
      .eq("id", projectId);

    // Step 2: Translate transcriptions
    console.log("[Process Audio] Step 2: Translating...");
    const translateResponse = await supabase.functions.invoke("translate", {
      body: { projectId, targetLanguage },
    });

    if (translateResponse.error) {
      throw new Error(`Translation failed: ${translateResponse.error.message}`);
    }

    console.log("[Process Audio] Translation completed");

    // Update status to synthesizing
    await supabase
      .from("projects")
      .update({ status: "synthesizing" })
      .eq("id", projectId);

    // Step 3: Synthesize dubbed audio
    console.log("[Process Audio] Step 3: Synthesizing...");
    const synthesizeResponse = await supabase.functions.invoke("synthesize", {
      body: { projectId, targetLanguage },
    });

    if (synthesizeResponse.error) {
      throw new Error(`Synthesis failed: ${synthesizeResponse.error.message}`);
    }

    const { dubbedAudioUrl } = synthesizeResponse.data;

    console.log("[Process Audio] Synthesis completed");

    // Update status to completed
    await supabase
      .from("projects")
      .update({
        status: "completed",
        dubbed_audio_url: dubbedAudioUrl,
        processing_completed_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    console.log(`[Process Audio] Processing completed for project: ${projectId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        projectId, 
        dubbedAudioUrl 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Process Audio] Error:", error);

    // Update project status to failed if we have projectId
    const body = await req.json().catch(() => ({}));
    if (body.projectId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase
            .from("projects")
            .update({ status: "failed" })
            .eq("id", body.projectId);
        }
      } catch (updateError) {
        console.error("[Process Audio] Failed to update error status:", updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
