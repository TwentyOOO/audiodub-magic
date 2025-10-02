import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TranslateRequest {
  projectId: string;
  targetLanguage: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, targetLanguage }: TranslateRequest = await req.json();

    if (!projectId || !targetLanguage) {
      throw new Error("Missing required parameters");
    }

    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Translate] Starting translation for project: ${projectId}`);

    // Fetch all transcriptions for this project
    const { data: transcriptions, error: fetchError } = await supabase
      .from("transcriptions")
      .select("*")
      .eq("project_id", projectId)
      .order("start_time", { ascending: true });

    if (fetchError) throw fetchError;

    if (!transcriptions || transcriptions.length === 0) {
      throw new Error("No transcriptions found for this project");
    }

    console.log(`[Translate] Translating ${transcriptions.length} segments...`);

    // Translate each transcription
    const updates = [];

    for (const transcription of transcriptions) {
      if (!transcription.original_text) continue;

      try {
        const translationResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openAIKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a professional translator. Translate the following text to ${targetLanguage}. Maintain the tone, style, and context. Only return the translated text without any additional commentary.`,
              },
              {
                role: "user",
                content: transcription.original_text,
              },
            ],
            temperature: 0.3,
          }),
        });

        if (!translationResponse.ok) {
          const error = await translationResponse.text();
          console.error(`[Translate] OpenAI error for transcription ${transcription.id}:`, error);
          continue;
        }

        const result = await translationResponse.json();
        const translatedText = result.choices[0]?.message?.content;

        if (translatedText) {
          updates.push({
            id: transcription.id,
            translated_text: translatedText.trim(),
          });
        }
      } catch (error) {
        console.error(`[Translate] Failed to translate transcription ${transcription.id}:`, error);
      }
    }

    // Batch update all translations
    console.log(`[Translate] Updating ${updates.length} translations in database...`);

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("transcriptions")
        .update({ translated_text: update.translated_text })
        .eq("id", update.id);

      if (updateError) {
        console.error(`[Translate] Failed to update transcription ${update.id}:`, updateError);
      }
    }

    console.log(`[Translate] Translation completed for project: ${projectId}`);

    return new Response(
      JSON.stringify({
        success: true,
        projectId,
        translatedCount: updates.length,
        totalCount: transcriptions.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Translate] Error:", error);

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
