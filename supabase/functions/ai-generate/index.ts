// AI Generation edge function — YAIDEV AI Builder.
// Two server-enforced modes:
//   mode="preview" -> limited, non-deliverable preview. Never consumes coins.
//                     Rate-limited server-side via claim_preview().
//   mode="full"    -> complete deliverable. Requires an authenticated user with
//                     paid coins; deducts coins via spend_credit() BEFORE generating.
// Response: { category, mode, result, coins } | { error, fallback?, requiresPayment? }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { routeJSON, corsHeaders, jsonResponse, TaskProfile } from "../_shared/ai-router.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
  software: `You are an elite software systems architect. Output JSON:
{"title":string,"summary":string,"modules":[{"name":string,"purpose":string,"features":string[]}],"roles":[{"role":string,"permissions":string[]}],"workflows":[{"name":string,"steps":string[]}],"dataModel":[{"entity":string,"fields":string[]}],"integrations":string[],"techStack":string[],"deployment":string[],"previewHtml":string}`,
  softwares: `You are an elite software systems architect. Output JSON:
{"title":string,"summary":string,"modules":[{"name":string,"purpose":string,"features":string[]}],"roles":[{"role":string,"permissions":string[]}],"workflows":[{"name":string,"steps":string[]}],"dataModel":[{"entity":string,"fields":string[]}],"integrations":string[],"techStack":string[],"deployment":string[],"previewHtml":string}`,
  games: `You are an elite game designer. Output JSON:
{"title":string,"genre":string,"summary":string,"mechanics":string[],"levels":[{"name":string,"goal":string,"difficulty":string}],"scoring":string,"progression":string,"art":string,"audio":string,"controls":string,"monetization":string,"techStack":string[],"previewHtml":string}
previewHtml = a PLAYABLE single-file HTML5 canvas game prototype.`,
  robots: `You are an elite robotics software engineer. Output JSON:
{"title":string,"summary":string,"robotType":string,"hardware":[{"component":string,"purpose":string}],"sensors":string[],"controlStack":[{"layer":string,"description":string}],"behaviours":[{"name":string,"trigger":string,"steps":string[]}],"safety":string[],"simulation":string,"techStack":string[],"deployment":string[],"previewHtml":string}
previewHtml = a single-file HTML control/telemetry dashboard mockup for this robot.`,
  agents: `You are an elite autonomous AI agent engineer. Output JSON:
{"title":string,"summary":string,"role":string,"capabilities":string[],"tools":[{"name":string,"purpose":string,"inputs":string[]}],"workflows":[{"trigger":string,"steps":string[]}],"memory":string,"guardrails":string[],"systemPrompt":string,"integrations":string[],"techStack":string[],"previewHtml":string}`,
  models: `You are an elite ML/AI model architect. Output JSON:
{"title":string,"summary":string,"task":string,"modelFamily":string,"dataStrategy":{"sources":string[],"labelling":string,"preprocessing":string[]},"architecture":string,"training":{"approach":string,"hyperparameters":object,"compute":string},"evaluation":{"metrics":string[],"benchmarks":string[]},"inference":{"serving":string,"latencyTarget":string},"risks":string[],"techStack":string[],"previewHtml":string}`,
  bots: `You are an elite conversational AI / automation engineer. Output JSON:
{"title":string,"summary":string,"platforms":string[],"intents":[{"name":string,"examples":string[],"response":string}],"workflows":[{"trigger":string,"steps":string[]}],"integrations":string[],"systemPrompt":string,"techStack":string[],"previewHtml":string}`,
  other: `You are an elite cross-disciplinary creator. Output JSON:
{"title":string,"summary":string,"approach":string,"deliverable":string,"details":object,"previewHtml":string}`,
};

// Deliberately limited preview — proves understanding, never completes the project.
const PREVIEW_SYSTEM = `You are YAIDEV's AI Builder running in LIMITED PREVIEW mode.
You must NOT produce the full project, full source code, deployment steps or a complete deliverable.
Produce a short, high-value teaser that proves you understood the request.
Return ONLY this JSON shape:
{
  "title": string,
  "understanding": string,            // 1-2 sentences restating the request precisely
  "requirements": string[],           // max 5 key requirements you extracted
  "architecture": string[],           // max 5 bullet points of the build approach
  "buildPlan": [{"phase": string, "outcome": string}],  // max 4 phases
  "previewHtml": string,              // ONE small self-contained HTML mockup section (<= 120 lines), visually polished, NOT the full product
  "locked": string[]                  // max 5 items that are unlocked only after subscribing
}
Keep it concise. No markdown fences.`;

const TASK_FOR: Record<string, TaskProfile> = {
  websites: "website", apps: "software", software: "software", softwares: "software",
  games: "code", robots: "code", agents: "reasoning", models: "reasoning",
  bots: "reasoning", other: "generic",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const t0 = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const { category, prompt, attachments = [], build_session_id = null } = body || {};
    const mode: "preview" | "full" = body?.mode === "full" ? "full" : "preview";
    if (!category || !prompt) return jsonResponse({ error: "Missing category or prompt", fallback: false });

    // ---- Authentication is mandatory for every generation ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Please sign in to continue.", requiresAuth: true, fallback: false });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const { data: userData, error: userErr } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "Please sign in to continue.", requiresAuth: true, fallback: false });
    }
    const user = userData.user;
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    let coinsInfo: Record<string, unknown> = {};

    if (mode === "preview") {
      const { data: claim, error: claimErr } = await userClient.rpc("claim_preview", {
        _user_id: user.id, _category: String(category),
      });
      if (claimErr) return jsonResponse({ error: claimErr.message, fallback: true });
      const c = claim as any;
      if (!c?.ok) {
        return jsonResponse({
          error: c?.error === "preview_limit_reached"
            ? `You've used all ${c?.cap ?? 5} free previews for today. Subscribe to keep building.`
            : "Preview unavailable.",
          requiresPayment: c?.error === "preview_limit_reached",
          fallback: false,
        });
      }
      coinsInfo = { previewsRemaining: c.remaining };
    } else {
      // Paid build — deduct BEFORE generating. Server is the only authority.
      const { data: spend, error: spendErr } = await userClient.rpc("spend_credit", {
        _user_id: user.id,
        _amount: 1,
        _reason: `build_${category}`,
        _build_session_id: build_session_id,
      });
      if (spendErr) return jsonResponse({ error: spendErr.message, fallback: true });
      const s = spend as any;
      if (!s?.ok) {
        return jsonResponse({
          error: s?.error === "no_credits"
            ? "You've used all your YAIDEV AI Coins for this billing period."
            : "Unable to start this build.",
          requiresPayment: true,
          fallback: false,
        });
      }
      coinsInfo = { paid_balance: s.paid_balance, unlimited: !!s.unlimited };
    }

    const system = mode === "preview"
      ? PREVIEW_SYSTEM
      : (SYSTEM_PROMPTS[category] || SYSTEM_PROMPTS.other);

    const userContent: any[] = [{ type: "text", text: prompt }];
    const notes: string[] = [];
    for (const a of (attachments as any[]).slice(0, 8)) {
      if (a?.kind === "image" && a?.dataUrl) userContent.push({ type: "image_url", image_url: { url: a.dataUrl } });
      else if (a?.kind === "text" && a?.textContent) userContent.push({ type: "text", text: `\n--- ${a.name} ---\n${a.textContent}\n--- end ${a.name} ---` });
      if (a) notes.push(`- ${a.kind || "file"}: ${a.name}`);
    }
    if (notes.length) userContent.unshift({ type: "text", text: `Reference materials:\n${notes.join("\n")}\n\nUser brief:` });

    console.log(`[ai-generate] mode=${mode} category=${category} user=${user.id}`);

    let result: any;
    try {
      const routed = await routeJSON({
        feature: mode === "preview" ? "ai-builder-preview" : "ai-builder",
        task: TASK_FOR[category] || "generic",
        messages: [
          { role: "system", content: system + "\n\nReturn ONLY valid JSON. No markdown fences." },
          { role: "user", content: userContent },
        ],
        userId: user.id,
      });
      result = routed.result;
      console.log(`[ai-generate] ok via ${routed.meta.provider}/${routed.meta.model} in ${Date.now() - t0}ms`);
    } catch (genErr: any) {
      // Refund the coin when a paid generation never produced anything.
      if (mode === "full") {
        await admin.rpc("admin_refund_noop").catch(() => {});
        const { data: cur } = await admin.from("user_credits").select("paid_balance").eq("user_id", user.id).maybeSingle();
        const newBal = (cur?.paid_balance ?? 0) + 1;
        await admin.from("user_credits").update({ paid_balance: newBal }).eq("user_id", user.id);
        await admin.from("coin_transactions").insert({
          user_id: user.id, amount: 1, type: "refund", reason: "generation_failed",
          balance_after: newBal, build_session_id,
        });
      }
      throw genErr;
    }

    // Persist to the build session so the work survives refresh / device change.
    if (build_session_id) {
      const patch: Record<string, unknown> = mode === "preview"
        ? { preview: result, state: "preview" }
        : { result, state: "completed", payment_status: "paid" };
      if (mode === "full") patch.coins_spent = 1;
      await admin.from("build_sessions").update(patch).eq("id", build_session_id).eq("user_id", user.id);
    }

    return jsonResponse({ category, mode, result, coins: coinsInfo });
  } catch (e: any) {
    const msg = e?.message || "AI request failed";
    console.error("[ai-generate] fatal:", msg);
    const lower = msg.toLowerCase();
    if (lower.includes("no ai providers")) return jsonResponse({ error: msg, fallback: false });
    if (lower.includes("all ai providers failed")) return jsonResponse({ error: "AI service is temporarily unreachable — please try again.", fallback: true });
    return jsonResponse({ error: msg, fallback: true });
  }
});
