// YAIDEV AI Gateway Admin endpoint. Admin-only.
// GET  ?action=overview   -> providers, models, config, stats
// POST { action: "update_provider" | "update_model" | "update_config", ... }
import { corsHeaders, jsonResponse, admin, invalidateRouterCache } from "../_shared/ai-router.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

async function requireAdmin(req: Request): Promise<{ userId: string } | Response> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData } = await sb.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  const { data: isAdmin } = await sb.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) return jsonResponse({ ok: false, error: "forbidden" }, 403);
  return { userId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const gate = await requireAdmin(req);
  if (gate instanceof Response) return gate;

  const sb = admin();
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = body.action || "overview";

    if (action === "overview") {
      const [providers, models, cfgRows, logs] = await Promise.all([
        sb.from("ai_providers").select("*").order("priority"),
        sb.from("ai_models").select("*").order("provider_slug"),
        sb.from("ai_routing_config").select("*"),
        sb.from("ai_request_logs").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      // Aggregate 24h stats in JS (small dataset).
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data: recent } = await sb.from("ai_request_logs").select("*").gte("created_at", since);
      const byProvider: Record<string, any> = {};
      let totalCost = 0, totalReq = 0, totalOK = 0, totalTokens = 0;
      for (const r of recent || []) {
        totalReq++;
        totalCost += Number(r.estimated_cost_usd || 0);
        totalTokens += Number(r.total_tokens || 0);
        if (r.success) totalOK++;
        const p = r.provider_slug || "unknown";
        byProvider[p] = byProvider[p] || { requests: 0, success: 0, latencyMs: 0, tokens: 0, cost: 0 };
        byProvider[p].requests++;
        if (r.success) byProvider[p].success++;
        byProvider[p].latencyMs += Number(r.latency_ms || 0);
        byProvider[p].tokens += Number(r.total_tokens || 0);
        byProvider[p].cost += Number(r.estimated_cost_usd || 0);
      }
      for (const k of Object.keys(byProvider)) {
        const b = byProvider[k];
        b.avgLatencyMs = b.requests ? Math.round(b.latencyMs / b.requests) : 0;
        b.successRate = b.requests ? b.success / b.requests : 1;
        b.cost = Number(b.cost.toFixed(4));
      }
      return jsonResponse({
        ok: true,
        providers: providers.data || [],
        models: models.data || [],
        config: Object.fromEntries((cfgRows.data || []).map((r: any) => [r.key, r.value])),
        recentLogs: logs.data || [],
        stats24h: {
          totalRequests: totalReq,
          successRate: totalReq ? totalOK / totalReq : 1,
          totalTokens,
          totalCostUsd: Number(totalCost.toFixed(4)),
          byProvider,
        },
      });
    }

    // (body & action already parsed above)

    if (action === "update_provider") {
      const { slug, patch } = body;
      if (!slug || !patch) return jsonResponse({ ok: false, error: "slug and patch required" });
      const allowed = ["enabled", "priority", "weight", "cooldown_until", "health_status", "consecutive_failures"];
      const safe: any = {};
      for (const k of allowed) if (k in patch) safe[k] = patch[k];
      await sb.from("ai_providers").update(safe).eq("slug", slug);
      invalidateRouterCache();
      return jsonResponse({ ok: true });
    }
    if (action === "update_model") {
      const { id, patch } = body;
      if (!id || !patch) return jsonResponse({ ok: false, error: "id and patch required" });
      const allowed = ["enabled", "display_name", "context_window", "max_output", "cost_input_per_1k", "cost_output_per_1k", "task_tags"];
      const safe: any = {};
      for (const k of allowed) if (k in patch) safe[k] = patch[k];
      await sb.from("ai_models").update(safe).eq("id", id);
      invalidateRouterCache();
      return jsonResponse({ ok: true });
    }
    if (action === "update_config") {
      const { key, value } = body;
      if (!key) return jsonResponse({ ok: false, error: "key required" });
      await sb.from("ai_routing_config").upsert({ key, value, updated_at: new Date().toISOString() });
      invalidateRouterCache();
      return jsonResponse({ ok: true });
    }
    if (action === "reset_provider") {
      const { slug } = body;
      await sb.from("ai_providers").update({
        consecutive_failures: 0, cooldown_until: null, health_status: "healthy",
      }).eq("slug", slug);
      invalidateRouterCache();
      return jsonResponse({ ok: true });
    }
    return jsonResponse({ ok: false, error: `unknown action ${action}` });
  } catch (e: any) {
    console.error("[ai-admin] fatal:", e);
    return jsonResponse({ ok: false, error: e?.message || "admin failed" });
  }
});
