// AI Generation edge function — YAIDEV AI Builder.
// Refactored to delegate to the multi-provider AI Router.
// Public request/response contract unchanged: { category, prompt, attachments } -> { category, result } | { error, fallback }
import { routeJSON, corsHeaders, jsonResponse, userIdFromAuth, TaskProfile } from "../_shared/ai-router.ts";

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

// Map builder category -> router task profile
const TASK_FOR: Record<string, TaskProfile> = {
  websites: "website", apps: "software", softwares: "software", games: "code",
  bots: "reasoning", videos: "creative", audios: "creative", designs: "creative",
  other: "generic",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const t0 = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const { category, prompt, attachments = [] } = body || {};
    if (!category || !prompt) return jsonResponse({ error: "Missing category or prompt", fallback: false });

    const system = SYSTEM_PROMPTS[category] || SYSTEM_PROMPTS.other;
    const userContent: any[] = [{ type: "text", text: prompt }];
    const notes: string[] = [];
    for (const a of (attachments as any[]).slice(0, 8)) {
      if (a?.kind === "image" && a?.dataUrl) userContent.push({ type: "image_url", image_url: { url: a.dataUrl } });
      else if (a?.kind === "text" && a?.textContent) userContent.push({ type: "text", text: `\n--- ${a.name} ---\n${a.textContent}\n--- end ${a.name} ---` });
      if (a) notes.push(`- ${a.kind || "file"}: ${a.name}`);
    }
    if (notes.length) userContent.unshift({ type: "text", text: `Reference materials:\n${notes.join("\n")}\n\nUser brief:` });

    const userId = await userIdFromAuth(req);
    console.log(`[ai-generate] category=${category} promptLen=${String(prompt).length}`);
    const { result, meta } = await routeJSON({
      feature: "ai-builder",
      task: TASK_FOR[category] || "generic",
      messages: [
        { role: "system", content: system + "\n\nReturn ONLY valid JSON. No markdown fences." },
        { role: "user", content: userContent },
      ],
      userId,
    });
    console.log(`[ai-generate] ok via ${meta.provider}/${meta.model} in ${Date.now() - t0}ms`);
    return jsonResponse({ category, result });
  } catch (e: any) {
    const msg = e?.message || "AI request failed";
    console.error("[ai-generate] fatal:", msg);
    const lower = msg.toLowerCase();
    if (lower.includes("no ai providers")) return jsonResponse({ error: msg, fallback: false });
    if (lower.includes("all ai providers failed")) return jsonResponse({ error: "AI service is temporarily unreachable — please try again.", fallback: true });
    return jsonResponse({ error: msg, fallback: true });
  }
});
