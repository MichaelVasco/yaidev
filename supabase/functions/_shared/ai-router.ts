// YAIDEV Enterprise AI Router
// Central multi-provider gateway. Every AI call funnels through `routeChat()`.
// Handles: provider selection by task profile, load-balancing weights,
// automatic failover across providers on 429/5xx/timeout, circuit-breaker
// cooldown per provider, and per-attempt logging.
//
// Providers currently supported (skip silently when env var missing):
//   openrouter | gemini | openai | anthropic | deepseek | xai | mistral | lovable

// deno-lint-ignore-file no-explicit-any

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const admin = () =>
  createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

export type TaskProfile =
  | "code" | "reasoning" | "chat" | "website" | "software"
  | "long_doc" | "business" | "creative" | "large_context" | "generic";

export interface ChatMsg { role: "system" | "user" | "assistant"; content: any }

export interface RouteOptions {
  feature: string;                 // e.g. "ai-builder", "project-assistant"
  task?: TaskProfile;
  messages: ChatMsg[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  model?: string;                  // optional explicit model_id
  userId?: string | null;
}

export interface RouteResult {
  text: string;
  provider: string;
  model: string;
  attempts: number;
  latencyMs: number;
  usage?: { prompt: number; completion: number; total: number };
}

// -------- Provider config cache (10s) --------
type Provider = {
  slug: string; enabled: boolean; priority: number; weight: number;
  env_var: string; base_url: string; cooldown_until: string | null;
  consecutive_failures: number;
};
type Model = {
  provider_slug: string; model_id: string; enabled: boolean; task_tags: string[];
  cost_input_per_1k: number; cost_output_per_1k: number;
};
type Config = { failover: any; task_profiles: Record<string, string[]> };

let cache: { at: number; providers: Provider[]; models: Model[]; cfg: Config } | null = null;
async function loadConfig() {
  if (cache && Date.now() - cache.at < 10_000) return cache;
  const sb = admin();
  const [pRes, mRes, cRes] = await Promise.all([
    sb.from("ai_providers").select("*"),
    sb.from("ai_models").select("*"),
    sb.from("ai_routing_config").select("*"),
  ]);
  const cfgRows = (cRes.data || []) as any[];
  const cfg: Config = {
    failover: cfgRows.find((r) => r.key === "failover")?.value || {},
    task_profiles: cfgRows.find((r) => r.key === "task_profiles")?.value || {},
  };
  cache = {
    at: Date.now(),
    providers: (pRes.data || []) as Provider[],
    models: (mRes.data || []) as Model[],
    cfg,
  };
  return cache;
}
export function invalidateRouterCache() { cache = null; }

// -------- Selection --------
function pickOrder(providers: Provider[], task: TaskProfile, cfg: Config): Provider[] {
  const now = Date.now();
  const healthy = providers.filter((p) =>
    p.enabled &&
    !!Deno.env.get(p.env_var) &&
    (!p.cooldown_until || new Date(p.cooldown_until).getTime() < now)
  );
  const profile = cfg.task_profiles[task] || cfg.task_profiles["generic"] || [];
  const inProfile = profile
    .map((slug) => healthy.find((h) => h.slug === slug))
    .filter(Boolean) as Provider[];
  // Weighted shuffle among the top-priority group; keep the rest in priority order as fallbacks.
  const rest = healthy.filter((h) => !inProfile.includes(h)).sort((a, b) => a.priority - b.priority);
  return [...weightedShuffle(inProfile), ...rest];
}

function weightedShuffle(list: Provider[]): Provider[] {
  const out: Provider[] = [];
  const pool = [...list];
  while (pool.length) {
    const total = pool.reduce((s, p) => s + Math.max(1, p.weight), 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= Math.max(1, pool[i].weight);
      if (r <= 0) { idx = i; break; }
    }
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function modelFor(provider: Provider, models: Model[], task: TaskProfile, explicit?: string): string {
  if (explicit) return explicit;
  const candidates = models.filter((m) => m.provider_slug === provider.slug && m.enabled);
  const tagged = candidates.filter((m) => m.task_tags.includes(task));
  const chosen = (tagged[0] || candidates[0]);
  return chosen?.model_id || defaultModel(provider.slug);
}

function defaultModel(slug: string): string {
  switch (slug) {
    case "openrouter": return "openai/gpt-5";
    case "openai":     return "gpt-5";
    case "gemini":     return "gemini-2.5-flash";
    case "anthropic":  return "claude-sonnet-4-5";
    case "deepseek":   return "deepseek-chat";
    case "xai":        return "grok-4";
    case "mistral":    return "mistral-large-latest";
    case "lovable":    return "google/gemini-2.5-flash";
    default:           return "gpt-5";
  }
}

// -------- Adapters (all normalize to { text, usage }) --------
async function callOpenAICompatible(
  baseUrl: string, apiKey: string, model: string, msgs: ChatMsg[],
  opts: { jsonMode?: boolean; temperature?: number; maxTokens?: number; timeoutMs: number },
  extraHeaders: Record<string, string> = {},
) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), opts.timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify({
        model,
        messages: msgs,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    const bodyText = await res.text();
    if (!res.ok) throw new HttpErr(res.status, bodyText.slice(0, 400));
    const j = JSON.parse(bodyText);
    const text = j.choices?.[0]?.message?.content ?? "";
    const u = j.usage || {};
    return {
      text,
      usage: {
        prompt: u.prompt_tokens || 0,
        completion: u.completion_tokens || 0,
        total: u.total_tokens || 0,
      },
    };
  } finally { clearTimeout(to); }
}

async function callLovable(apiKey: string, model: string, msgs: ChatMsg[], opts: any) {
  return callOpenAICompatible("https://ai.gateway.lovable.dev/v1", apiKey, model, msgs, opts);
}

async function callOpenRouter(apiKey: string, model: string, msgs: ChatMsg[], opts: any) {
  return callOpenAICompatible("https://openrouter.ai/api/v1", apiKey, model, msgs, opts, {
    "HTTP-Referer": "https://yaidev.com",
    "X-Title": "YAIDEV",
  });
}

async function callOpenAI(apiKey: string, model: string, msgs: ChatMsg[], opts: any) {
  return callOpenAICompatible("https://api.openai.com/v1", apiKey, model, msgs, opts);
}
async function callDeepSeek(apiKey: string, model: string, msgs: ChatMsg[], opts: any) {
  return callOpenAICompatible("https://api.deepseek.com/v1", apiKey, model, msgs, opts);
}
async function callGrok(apiKey: string, model: string, msgs: ChatMsg[], opts: any) {
  return callOpenAICompatible("https://api.x.ai/v1", apiKey, model, msgs, opts);
}
async function callMistral(apiKey: string, model: string, msgs: ChatMsg[], opts: any) {
  return callOpenAICompatible("https://api.mistral.ai/v1", apiKey, model, msgs, opts);
}

async function callAnthropic(apiKey: string, model: string, msgs: ChatMsg[], opts: any) {
  const sys = msgs.filter((m) => m.role === "system").map((m) => String(m.content)).join("\n\n");
  const rest = msgs.filter((m) => m.role !== "system").map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
  }));
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), opts.timeoutMs);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: opts.maxTokens || 4096,
        temperature: opts.temperature,
        system: sys || undefined,
        messages: rest,
      }),
    });
    const bodyText = await res.text();
    if (!res.ok) throw new HttpErr(res.status, bodyText.slice(0, 400));
    const j = JSON.parse(bodyText);
    const text = (j.content || []).map((c: any) => c.text || "").join("");
    const u = j.usage || {};
    return { text, usage: { prompt: u.input_tokens || 0, completion: u.output_tokens || 0, total: (u.input_tokens || 0) + (u.output_tokens || 0) } };
  } finally { clearTimeout(to); }
}

async function callGemini(apiKey: string, model: string, msgs: ChatMsg[], opts: any) {
  const sys = msgs.filter((m) => m.role === "system").map((m) => String(m.content)).join("\n\n");
  const contents = msgs.filter((m) => m.role !== "system").map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
  }));
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), opts.timeoutMs);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: sys ? { parts: [{ text: sys }] } : undefined,
        generationConfig: {
          temperature: opts.temperature,
          maxOutputTokens: opts.maxTokens,
          ...(opts.jsonMode ? { responseMimeType: "application/json" } : {}),
        },
      }),
    });
    const bodyText = await res.text();
    if (!res.ok) throw new HttpErr(res.status, bodyText.slice(0, 400));
    const j = JSON.parse(bodyText);
    const text = j.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") ?? "";
    const u = j.usageMetadata || {};
    return { text, usage: { prompt: u.promptTokenCount || 0, completion: u.candidatesTokenCount || 0, total: u.totalTokenCount || 0 } };
  } finally { clearTimeout(to); }
}

class HttpErr extends Error { constructor(public status: number, msg: string) { super(`HTTP ${status}: ${msg}`); } }

function retriable(err: any): boolean {
  if (err?.name === "AbortError") return true;
  if (err instanceof HttpErr) return err.status === 429 || err.status >= 500;
  return true; // network / DNS / other
}

async function dispatch(provider: Provider, model: string, msgs: ChatMsg[], opts: any) {
  const key = Deno.env.get(provider.env_var);
  if (!key) throw new Error(`missing env ${provider.env_var}`);
  switch (provider.slug) {
    case "openrouter": return callOpenRouter(key, model, msgs, opts);
    case "openai":     return callOpenAI(key, model, msgs, opts);
    case "deepseek":   return callDeepSeek(key, model, msgs, opts);
    case "xai":        return callGrok(key, model, msgs, opts);
    case "mistral":    return callMistral(key, model, msgs, opts);
    case "anthropic":  return callAnthropic(key, model, msgs, opts);
    case "gemini":     return callGemini(key, model, msgs, opts);
    case "lovable":    return callLovable(key, model, msgs, opts);
    default: throw new Error(`unknown provider ${provider.slug}`);
  }
}

// -------- Health / logging --------
async function logAttempt(row: any) {
  try { await admin().from("ai_request_logs").insert(row); } catch (_) { /* ignore */ }
}

async function markFailure(p: Provider, cfg: any) {
  const threshold = cfg?.failure_threshold ?? 3;
  const cooldownS = cfg?.cooldown_seconds ?? 120;
  const fails = (p.consecutive_failures || 0) + 1;
  const patch: any = { consecutive_failures: fails, last_failure_at: new Date().toISOString() };
  if (fails >= threshold) {
    patch.cooldown_until = new Date(Date.now() + cooldownS * 1000).toISOString();
    patch.health_status = "degraded";
    patch.consecutive_failures = 0;
  }
  await admin().from("ai_providers").update(patch).eq("slug", p.slug);
  invalidateRouterCache();
}
async function markSuccess(p: Provider) {
  if (p.consecutive_failures || p.cooldown_until || p.health_status !== "healthy") {
    await admin().from("ai_providers").update({
      consecutive_failures: 0, cooldown_until: null, health_status: "healthy",
    }).eq("slug", p.slug);
    invalidateRouterCache();
  }
}

// -------- Main entry --------
export async function routeChat(o: RouteOptions): Promise<RouteResult> {
  const task: TaskProfile = o.task || "generic";
  const { providers, models, cfg } = await loadConfig();
  const order = pickOrder(providers, task, cfg);
  if (!order.length) throw new Error("No AI providers are currently available. Please configure at least one provider API key.");

  const failover = cfg.failover || {};
  const maxAttempts = Math.min(order.length, failover.max_attempts ?? 5);
  const timeoutMs = failover.timeout_ms ?? 60_000;
  const backoff = failover.backoff_ms ?? 400;

  let lastErr: any;
  for (let i = 0; i < maxAttempts; i++) {
    const provider = order[i];
    const model = modelFor(provider, models, task, o.model);
    const started = Date.now();
    const attempt = i + 1;
    try {
      const out = await dispatch(provider, model, o.messages, {
        jsonMode: o.jsonMode,
        temperature: o.temperature,
        maxTokens: o.maxTokens,
        timeoutMs,
      });
      const latencyMs = Date.now() - started;
      const modelRow = models.find((m) => m.provider_slug === provider.slug && m.model_id === model);
      const cost =
        ((out.usage.prompt / 1000) * (modelRow?.cost_input_per_1k || 0)) +
        ((out.usage.completion / 1000) * (modelRow?.cost_output_per_1k || 0));
      await Promise.all([
        markSuccess(provider),
        logAttempt({
          user_id: o.userId ?? null, feature: o.feature, task_profile: task,
          provider_slug: provider.slug, model_id: model,
          latency_ms: latencyMs, prompt_tokens: out.usage.prompt,
          completion_tokens: out.usage.completion, total_tokens: out.usage.total,
          estimated_cost_usd: Number(cost.toFixed(6)),
          attempt, success: true,
        }),
      ]);
      return { text: out.text, provider: provider.slug, model, attempts: attempt, latencyMs, usage: out.usage };
    } catch (err: any) {
      const latencyMs = Date.now() - started;
      lastErr = err;
      const shouldRetry = retriable(err);
      console.error(`[ai-router] ${provider.slug}/${model} attempt ${attempt} failed:`, err?.message || err);
      await logAttempt({
        user_id: o.userId ?? null, feature: o.feature, task_profile: task,
        provider_slug: provider.slug, model_id: model, latency_ms: latencyMs,
        attempt, success: false, error: String(err?.message || err).slice(0, 500),
      });
      if (shouldRetry) await markFailure(provider, failover);
      if (backoff > 0) await new Promise((r) => setTimeout(r, backoff * attempt));
      continue;
    }
  }
  throw new Error(`All AI providers failed. Last error: ${lastErr?.message || lastErr}`);
}

// Convenience: JSON-mode call that returns parsed object
export async function routeJSON<T = any>(o: RouteOptions): Promise<{ result: T; meta: Omit<RouteResult, "text"> }> {
  const r = await routeChat({ ...o, jsonMode: true });
  let parsed: any;
  try { parsed = JSON.parse(r.text); }
  catch { const m = r.text.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { raw: r.text }; }
  const { text: _t, ...meta } = r;
  return { result: parsed, meta };
}

// CORS helper for edge functions
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
export const jsonResponse = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Extract userId from JWT if present (best-effort; router works anonymously too).
export async function userIdFromAuth(req: Request): Promise<string | null> {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return null;
    const sb = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: auth } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await sb.auth.getUser();
    return data.user?.id ?? null;
  } catch { return null; }
}
