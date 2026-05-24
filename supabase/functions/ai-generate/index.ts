// AI Generation edge function — YAIDEV AI Builder execution engine
// Handles: websites, apps, softwares, games, bots, videos, audios, designs, other (text-based deliverables)
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  websites: `You are an elite full-stack web architect. Given a user brief, design a complete, production-ready website. Output a single JSON object with this exact shape:
{
  "title": string, "tagline": string, "summary": string,
  "audience": string, "industry": string,
  "features": string[], "pages": [{"name":string,"purpose":string,"sections":string[]}],
  "techStack": string[], "integrations": string[],
  "designSystem": {"palette":string[],"typography":string,"vibe":string},
  "seo": {"title":string,"description":string,"keywords":string[]},
  "deployment": string[],
  "previewHtml": string  // a SELF-CONTAINED responsive HTML document (with inline <style>) showing the landing page hero + key sections. Real copy. No lorem ipsum. Use modern CSS, gradients, semantic HTML.
}
Be specific, professional, complete. No placeholders.`,
  apps: `You are an elite mobile/web app architect. Output JSON:
{"title":string,"summary":string,"platform":string,"audience":string,"coreFeatures":string[],"userFlows":[{"name":string,"steps":string[]}],"screens":[{"name":string,"components":string[]}],"dataModel":[{"entity":string,"fields":string[]}],"apis":string[],"techStack":string[],"auth":string,"monetization":string,"previewHtml":string}
previewHtml = a polished mobile-frame HTML mockup of the main screen (inline CSS). Real copy.`,
  softwares: `You are an elite software systems architect. Output JSON:
{"title":string,"summary":string,"modules":[{"name":string,"purpose":string,"features":string[]}],"roles":[{"role":string,"permissions":string[]}],"workflows":[{"name":string,"steps":string[]}],"dataModel":[{"entity":string,"fields":string[]}],"integrations":string[],"techStack":string[],"deployment":string[],"previewHtml":string}
previewHtml = HTML mockup of the main admin dashboard with sidebar + cards + table (inline CSS).`,
  games: `You are an elite game designer. Output JSON:
{"title":string,"genre":string,"summary":string,"mechanics":string[],"levels":[{"name":string,"goal":string,"difficulty":string}],"scoring":string,"progression":string,"art":string,"audio":string,"controls":string,"monetization":string,"techStack":string[],"previewHtml":string}
previewHtml = a PLAYABLE single-file HTML5 canvas game prototype matching the brief (inline <style> and <script>). Must actually work in a browser.`,
  bots: `You are an elite conversational AI / automation engineer. Output JSON:
{"title":string,"summary":string,"platforms":string[],"intents":[{"name":string,"examples":string[],"response":string}],"workflows":[{"trigger":string,"steps":string[]}],"integrations":string[],"systemPrompt":string,"techStack":string[],"previewHtml":string}
previewHtml = a chat UI mockup showing 3-4 realistic example exchanges (inline CSS).`,
  videos: `You are an elite video director/producer. Output JSON:
{"title":string,"logline":string,"durationSeconds":number,"style":string,"scenes":[{"n":number,"duration":string,"visual":string,"audio":string,"voiceover":string,"onScreenText":string}],"music":string,"transitions":string[],"colorGrade":string,"previewHtml":string}
previewHtml = a storyboard HTML page rendering each scene as a card with visual description + VO (inline CSS).`,
  audios: `You are an elite audio producer/composer. Output JSON:
{"title":string,"summary":string,"style":string,"durationSeconds":number,"structure":[{"section":string,"duration":string,"description":string,"instrumentation":string[]}],"voiceover":string,"mixingNotes":string,"masteringNotes":string,"previewHtml":string}
previewHtml = an audio production sheet rendered as an HTML page (inline CSS).`,
  designs: `You are an elite brand/graphic designer. Output JSON:
{"title":string,"brief":string,"concept":string,"palette":string[],"typography":{"heading":string,"body":string},"layout":string,"deliverables":string[],"previewHtml":string}
previewHtml = the actual design rendered with HTML+CSS (poster/flyer/card style matching the brief).`,
  other: `You are an elite cross-disciplinary creator. Determine the best deliverable for the user's request, then output JSON:
{"title":string,"summary":string,"approach":string,"deliverable":string,"details":object,"previewHtml":string}
previewHtml = the actual rendered deliverable as a self-contained HTML page.`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { category, prompt } = await req.json();
    if (!category || !prompt) {
      return new Response(JSON.stringify({ error: "Missing category or prompt" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const system = SYSTEM_PROMPTS[category] || SYSTEM_PROMPTS.other;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: system + "\n\nReturn ONLY valid JSON. No markdown fences. No commentary." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const status = res.status;
      const text = await res.text();
      console.error("AI gateway error:", status, text);
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(content); }
    catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { raw: content };
    }

    return new Response(JSON.stringify({ category, result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
