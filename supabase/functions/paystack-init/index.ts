import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BodySchema = z.object({
  // Authoritative identifier of the exact plan row the user clicked.
  plan_id: z.string().uuid().optional(),
  // Legacy / fallback identification.
  plan_slug: z.string().min(2).max(64).optional(),
  billing_cycle: z.enum(["monthly", "yearly"]).default("monthly"),
  callback_url: z.string().url(),
  build_session_id: z.string().uuid().nullable().optional(),
  // Purely informational: what the client displayed. Never used to price.
  display_currency: z.string().max(8).optional(),
});

// Yearly Paystack plan codes live in env secrets so they can be rotated
// without a schema change. Monthly codes are stored on the plan row.
function envPlanCode(slug: string, cycle: "monthly" | "yearly"): string | null {
  if (cycle !== "yearly") return null;
  const key = `PAYSTACK_PLAN_${slug.toUpperCase()}_YEARLY`;
  const val = Deno.env.get(key);
  return val && val.trim().length > 0 ? val.trim() : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const trace: Record<string, unknown> = {};

  try {
    if (!PAYSTACK_SECRET) return json({ ok: false, error: "Paystack not configured", trace }, 200);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ ok: false, error: "unauthorized", trace }, 200);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData.user) return json({ ok: false, error: "unauthorized", trace }, 200);
    const user = userData.user;
    trace.user_id = user.id;

    const rawBody = await req.json().catch(() => ({}));
    trace.incoming_body = rawBody;
    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return json({ ok: false, error: "invalid_body", detail: parsed.error.flatten(), trace }, 200);
    }
    const { plan_id, plan_slug, billing_cycle, callback_url, build_session_id = null } = parsed.data;
    if (!plan_id && !plan_slug) return json({ ok: false, error: "missing_plan_selection", trace }, 200);
    trace.plan_id = plan_id;
    trace.plan_slug = plan_slug;
    trace.billing_cycle = billing_cycle;

    // ---- Server is the single source of truth for plan, amount and interval ----
    let query = admin
      .from("subscription_plans")
      .select("id,slug,name,price_cents,currency,monthly_credits,paystack_plan_code,is_active,billing_cycle");
    query = plan_id ? query.eq("id", plan_id) : query.eq("slug", plan_slug!).eq("billing_cycle", billing_cycle);

    const { data: plan, error: planErr } = await query.maybeSingle();
    trace.db_plan = plan;
    trace.db_error = planErr?.message;

    if (planErr) return json({ ok: false, error: "db_error", detail: planErr.message, trace }, 200);
    if (!plan) return json({ ok: false, error: "plan_not_found", detail: `No ${billing_cycle} plan for the selection`, trace }, 200);
    if (!plan.is_active) return json({ ok: false, error: "plan_inactive", trace }, 200);

    // Guard against a stale/mismatched client selection.
    if (plan_slug && plan.slug !== plan_slug) {
      return json({ ok: false, error: "plan_mismatch", detail: "Selected plan does not match server record", trace }, 200);
    }
    if (plan.billing_cycle !== billing_cycle) {
      return json({ ok: false, error: "cycle_mismatch", detail: `Plan '${plan.slug}' is ${plan.billing_cycle}, not ${billing_cycle}`, trace }, 200);
    }

    const amount = Number(plan.price_cents); // kobo, server-determined
    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ ok: false, error: "invalid_amount", trace }, 200);
    }

    const paystackPlanCode = plan.paystack_plan_code || envPlanCode(plan.slug, billing_cycle);
    trace.plan_code = paystackPlanCode;
    if (billing_cycle === "yearly" && !paystackPlanCode) {
      return json({
        ok: false,
        error: "missing_yearly_plan_code",
        detail: `Set env secret PAYSTACK_PLAN_${plan.slug.toUpperCase()}_YEARLY to your Paystack yearly plan code.`,
        trace,
      }, 200);
    }

    const reference = `YAIDEV-${plan.slug.toUpperCase()}-${billing_cycle.toUpperCase()}-${user.id.slice(0, 8)}-${Date.now()}`;
    trace.reference = reference;
    trace.amount = amount;
    trace.currency = plan.currency;
    console.log("[paystack-init]", plan.slug, billing_cycle, "code:", paystackPlanCode, "amount:", amount, "user:", user.id);

    const payload: Record<string, unknown> = {
      email: user.email,
      amount,
      currency: plan.currency,
      reference,
      callback_url,
      metadata: {
        user_id: user.id,
        plan_id: plan.id,
        plan_slug: plan.slug,
        plan_name: plan.name,
        plan_code: paystackPlanCode,
        billing_cycle,
        coins: plan.monthly_credits,
        build_session_id,
        custom_fields: [
          { display_name: "Plan", variable_name: "plan", value: plan.name },
          { display_name: "Cycle", variable_name: "cycle", value: billing_cycle },
          { display_name: "Credits", variable_name: "credits", value: String(plan.monthly_credits) },
        ],
      },
    };
    if (paystackPlanCode) payload.plan = paystackPlanCode;

    const doInit = async (body: Record<string, unknown>) => {
      const r = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      return { r, j };
    };

    const recordPending = async () => {
      await admin.from("transactions").insert({
        user_id: user.id, plan: plan.slug, provider: "paystack",
        amount_cents: amount, currency: plan.currency, status: "pending",
        reference, coins_added: 0,
      });
    };

    const { r: resp, j: out } = await doInit(payload);
    trace.paystack_status = resp.status;
    trace.paystack_response = out;

    if ((!resp.ok || !out.status) && paystackPlanCode) {
      // Retry once as a one-time charge for the SAME plan's amount (never another plan's price).
      const fallback = { ...payload };
      delete (fallback as any).plan;
      const retry = await doInit(fallback);
      trace.paystack_retry_status = retry.r.status;
      trace.paystack_retry_response = retry.j;
      if (retry.r.ok && retry.j.status) {
        await recordPending();
        return json({
          ok: true,
          authorization_url: retry.j.data.authorization_url,
          reference: retry.j.data.reference,
          access_code: retry.j.data.access_code,
          plan: { id: plan.id, slug: plan.slug, name: plan.name, amount, currency: plan.currency, billing_cycle, coins: plan.monthly_credits },
          warning: "fallback_without_plan_code",
          trace,
        });
      }
      return json({ ok: false, error: retry.j.message || out.message || "paystack_init_failed", detail: { first: out, retry: retry.j }, trace }, 200);
    }

    if (!resp.ok || !out.status) {
      return json({ ok: false, error: out.message || "paystack_init_failed", detail: out, trace }, 200);
    }

    await recordPending();

    return json({
      ok: true,
      authorization_url: out.data.authorization_url,
      reference: out.data.reference,
      access_code: out.data.access_code,
      plan: { id: plan.id, slug: plan.slug, name: plan.name, amount, currency: plan.currency, billing_cycle, coins: plan.monthly_credits },
      trace,
    });
  } catch (e: any) {
    console.error("[paystack-init] exception:", e?.message, e?.stack);
    return json({ ok: false, error: e?.message || String(e), stack: e?.stack, trace }, 200);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
