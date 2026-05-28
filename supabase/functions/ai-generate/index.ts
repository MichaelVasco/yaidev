// AI Generation edge function — YAIDEV AI Builder execution engine
// Always returns HTTP 200 with a structured JSON body so the frontend can
// surface readable errors instead of a generic "non-2xx status code".
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

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
  "previewHtml": string
}
Be specific, professional, complete. No placeholders.`,
  apps: `You are an elite mobile/web app architect. Output JSON:
{"title":string,"summary":string,"platform":string,"audience":string,"coreFeatures":string[],"userFlows":[{"name":string,"steps":string[]}],"screens":[{"name":string,"components":string[]}],"dataModel":[{"entity":string,"fields":string[]}],"apis":string[],"techStack":string[],"auth":string,"monetization":string,"previewHtml":string}`,
  softwares: `You are an elite software systems architect. Output JSON:
{"title":string,"summary":string,"modules":[{"name":string,"purpose":string,"features":string[]}],"roles":[{"role":string,"permissions":string[]}],"workflows":[{"name":string,"steps":string[]}],"dataModel":[{"entity":string,"fields":string[]}],"integrations":string[],"techStack":string[],"deployment":string[],"previewHtml":string}`,
  games: `You are an elite game designer. Output JSON:
{"title":string,"genre":string,"summary":string,"mechanics":string[],"levels":[{"name":string,"goal":string,"difficulty":string}],"scoring":string,"progression":string,"art":string,"audio":string,"controls":string,"monetization":string,"techStack":string[],"previewHtml":string}
previewHtml = a PLAYABLE single-file HTML5 canvas game prototype.`,
  bots: `You are an elite conversational AI / automation engineer. Output JSON:
{"title":string,"summary":string,"platforms":string[],"intents":[{"name":string,"examples":string[],"response":string}],"workflows":[{"trigger":string,"steps":string[]}],"integrations":string[],"systemPrompt":string,"techStack":string[],"previewHtml":string}`,
  videos: `You are an elite video director/producer. Output JSON:
{"title":string,"logline":string,"durationSeconds":number,"style":string,"scenes":[{"n":number,"duration":string,"visual":string,"audio":string,"voiceover":string,"onScreenText":string}],"music":string,"transitions":string[],"colorGrade":string,"previewHtml":string}`,
  audios: `You are an elite audio producer/composer. Output JSON:
{"title":string,"summary":string,"style":string,"durationSeconds":number,"structure":[{"section":string,"duration":string,"description":string,"instrumentation":string[]}],"voiceover":string,"mixingNotes":string,"masteringNotes":string,"previewHtml":string}`,
  designs: `You are an elite brand/graphic designer. Output JSON:
{"title":string,"brief":string,"concept":string,"palette":string[],"typography":{"heading":string,"body":string},"layout":string,"deliverables":string[],"previewHtml":string}`,
  other: `You are an elite cross-disciplinary creator. Output JSON:
{"title":string,"summary":string,"approach":string,"deliverable":string,"details":object,"previewHtml":string}`,
};

async function callGateway(apiKey: string, payload: unknown, attempt = 1): Promise<Response> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  // Retry once on transient upstream errors
  if (!res.ok && (res.status === 502 || res.status === 503 || res.status === 504) && attempt < 2) {
    console.warn(`[ai-generate] transient ${res.status}, retrying attempt ${attempt + 1}`);
    await new Promise((r) => setTimeout(r, 800));
    return callGateway(apiKey, payload, attempt + 1);
  }
  return res;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const t0 = Date.now();
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body", fallback: false }, 200);
    }

    const { category, prompt, attachments = [] } = body || {};
    if (!category || !prompt) {
      console.error("[ai-generate] missing params", { hasCategory: !!category, hasPrompt: !!prompt });
      return json({ error: "Missing category or prompt", fallback: false }, 200);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[ai-generate] LOVABLE_API_KEY not configured");
      return json({ error: "AI service is not configured. Please contact support.", fallback: false }, 200);
    }

    console.log(`[ai-generate] category=${category} promptLen=${String(prompt).length} attachments=${attachments?.length || 0}`);

    const system = SYSTEM_PROMPTS[category] || SYSTEM_PROMPTS.other;

    const userContent: any[] = [{ type: "text", text: prompt }];
    const contextNotes: string[] = [];
    for (const a of (attachments as any[]).slice(0, 8)) {
      if (a?.kind === "image" && a?.dataUrl) {
        userContent.push({ type: "image_url", image_url: { url: a.dataUrl } });
        contextNotes.push(`- Image reference: ${a.name}`);
      } else if (a?.kind === "text" && a?.textContent) {
        userContent.push({ type: "text", text: `\n--- ${a.name} ---\n${a.textContent}\n--- end ${a.name} ---` });
        contextNotes.push(`- Text file: ${a.name}`);
      } else if (a) {
        contextNotes.push(`- ${a.kind || "file"}: ${a.name} (${a.mime}, ${Math.round((a.size || 0) / 1024)} KB)`);
      }
    }
    if (contextNotes.length) {
      userContent.unshift({ type: "text", text: `Reference materials:\n${contextNotes.join("\n")}\n\nUser brief:` });
    }

    let res: Response;
    try {
      res = await callGateway(LOVABLE_API_KEY, {
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: system + "\n\nReturn ONLY valid JSON. No markdown fences." },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      });
    } catch (e) {
      console.error("[ai-generate] network error calling gateway:", e);
      return json({ error: "AI service is temporarily unreachable. Please try again.", fallback: true }, 200);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[ai-generate] gateway ${res.status}:`, text.slice(0, 500));
      if (res.status === 429) return json({ error: "We're getting a lot of requests right now — please try again in a moment.", fallback: true }, 200);
      if (res.status === 402) return json({ error: "AI credits exhausted. Please add credits to continue.", fallback: false }, 200);
      if (res.status === 408 || res.status >= 500) return json({ error: "AI service hiccup — please try again.", fallback: true }, 200);
      return json({ error: `AI request failed (${res.status}). Please refine your prompt and try again.`, fallback: false }, 200);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { raw: content };
    }

    console.log(`[ai-generate] success in ${Date.now() - t0}ms`);
    return json({ category, result: parsed });
  } catch (e) {
    console.error("[ai-generate] unexpected error:", e);
    return json({ error: "Something went wrong on our side. Please try again.", fallback: true }, 200);
  }
});
