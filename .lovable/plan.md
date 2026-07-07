# Enterprise Multi-AI Gateway for YAIDEV

Replace the single-provider AI backend with a centralized **AI Router** that intelligently routes every request across 7 providers with automatic failover. Nothing about branding, UI, auth, Paystack, subscriptions, AI Coins, or existing user data changes.

## 1. Providers & Secrets

Add secrets (Lovable Cloud, server-only):
- `OPENROUTER_API_KEY` (default gateway)
- `GOOGLE_GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `DEEPSEEK_API_KEY`
- `XAI_API_KEY`
- `MISTRAL_API_KEY`

Existing `LOVABLE_API_KEY` stays as an additional internal fallback so YAIDEV keeps working while the user is collecting third-party keys. Any provider whose key is missing is skipped automatically — the router only uses providers that have keys configured.

## 2. Central AI Router (edge function)

New shared module `supabase/functions/_shared/ai-router.ts` with:

- **Provider adapters** — one adapter per provider exposing `chatCompletion({ messages, model, stream, temperature })` and normalizing output to a common shape (OpenAI-style). Handles both streaming (SSE) and non-streaming.
- **Task profiles** — `code | reasoning | chat | website | software | long_doc | business | creative | large_context | image | generic`, each with an ordered provider→model preference list matching the spec (Coding: OpenRouter GPT-5 → OpenAI → Claude; Creative: Claude first; Large context: Gemini first; etc.).
- **Priority order** (default): OpenRouter → Gemini → OpenAI → Claude → DeepSeek → Grok → Mistral.
- **Load-balancing weights** — read from `ai_provider_config` table; router does weighted random pick among healthy providers in the profile, then falls back down the priority chain on failure.
- **Failover** — retry next provider on HTTP `429, 500, 502, 503, 504`, timeout, network error, quota/rate-limit responses. Max N attempts, exponential backoff. Circuit-breaker: a provider that fails M times in a rolling window is marked unhealthy for a cooldown period.
- **Observability** — writes every attempt to `ai_request_logs`: provider, model, latency_ms, prompt_tokens, completion_tokens, estimated_cost_usd, attempt #, success/failure, error, user_id, feature, task_profile, timestamp.
- **Streaming** — returns a `ReadableStream` of OpenAI-style SSE deltas regardless of upstream provider so the frontend has one contract.

## 3. Edge functions (public surface, unchanged names where possible)

- `ai-router` (new) — POST `{ feature, task, messages, stream, model?, temperature? }`. Handles auth (`verify_jwt` in code), calls `spend_credit` RPC, then routes. Streams via SSE when `stream: true`.
- `ai-generate`, `ai-chat`, `ai-image`, `ai-service` (existing) — refactor internals to call the router. Public request/response shapes stay identical so no frontend page breaks.
- `ai-admin` (new, admin-only via `has_role`) — GET status, POST config updates (weights, priority, enable/disable providers/models).

Image generation stays on Lovable AI (`google/gemini-2.5-flash-image`) as primary with OpenAI images as fallback — provider-agnostic through the router.

## 4. Database (migration)

```
ai_providers(slug pk, name, enabled, priority, weight, health_status, last_failure_at, cooldown_until, created_at)
ai_models(id pk, provider_slug fk, model_id, display_name, context_window, max_output, cost_input_per_1k, cost_output_per_1k, enabled, task_tags text[])
ai_request_logs(id pk, user_id, feature, task_profile, provider_slug, model_id, latency_ms, prompt_tokens, completion_tokens, estimated_cost_usd, attempt, success, error, created_at)
ai_routing_config(key pk, value jsonb, updated_at) -- global toggles, per-task overrides
```

All in `public`, with GRANTs, RLS: providers/models/config readable by admins only; logs readable by admins; nothing writable by client (edge functions use service role).

Seed rows for all 7 providers and the model catalog listed in the spec.

## 5. Admin Dashboard

Extend `src/pages/Admin.tsx` with a new "AI Gateway" tab:
- Provider list with health badge (healthy / degraded / down), enable toggle, priority up/down, weight slider (percent).
- Model catalog table: provider, model id, context, cost, enable toggle.
- Live stats (last 24h / 30d): requests, success %, avg latency, tokens, estimated cost — grouped by provider and by feature. Charts via existing recharts.
- Recent failures log with retry chain.

All powered by `ai-admin` edge function.

## 6. Security & backward compatibility

- All provider calls stay server-side. Keys never touch the client.
- Every router call re-verifies the JWT and deducts AI coins exactly as today via `spend_credit`.
- Frontend contracts unchanged — Website Builder, App Builder, AI Agents, Project Assistant, Social/Email/Office/Company managers, Logo/Image generation, Chat, everything keeps working.
- Existing Paystack, subscription, AI Coin, dashboard, publishing flows untouched.

## 7. Rollout order

1. Ask user for the 7 provider API keys (via `add_secret`, one secure form). Missing keys => that provider stays disabled but the router still works with whatever is present (Lovable AI + whatever keys land first).
2. Migration for the 4 new tables + seed data.
3. `_shared/ai-router.ts` + adapters + streaming.
4. `ai-router` edge function; refactor `ai-generate`, `ai-chat`, `ai-image`, `ai-service` to delegate.
5. `ai-admin` edge function + Admin UI tab.
6. Smoke test each existing AI surface (Builder, Chat, Agents, Image, Project Assistant, Social/Email/Office/Company) — no UI regressions.

## Notes for the user

- You can start using YAIDEV immediately after step 1 with just OpenRouter — the other providers will slot in as their keys are added.
- Nothing on the pricing page, Paystack flow, coin balance, or existing dashboards will change visually.
