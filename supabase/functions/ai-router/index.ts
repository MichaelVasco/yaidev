// YAIDEV central AI router endpoint.
// POST { feature, task, messages, temperature?, maxTokens?, jsonMode?, model? }
// Delegates to the shared multi-provider router with automatic failover.
import { routeChat, corsHeaders, jsonResponse, userIdFromAuth, TaskProfile } from "../_shared/ai-router.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const { feature, task, messages, temperature, maxTokens, jsonMode, model } = body || {};
    if (!feature || !Array.isArray(messages) || !messages.length) {
      return jsonResponse({ ok: false, error: "feature and messages[] are required" });
    }
    const userId = await userIdFromAuth(req);
    const r = await routeChat({
      feature, task: task as TaskProfile, messages,
      temperature, maxTokens, jsonMode, model, userId,
    });
    return jsonResponse({ ok: true, ...r });
  } catch (e: any) {
    console.error("[ai-router] fatal:", e);
    return jsonResponse({ ok: false, error: e?.message || "AI router failed" });
  }
});
