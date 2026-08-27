import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BodySchema = z.object({
  plan_slug: z.string().min(2).max(64),
  billing_cycle: z.enum(["monthly", "yearly"]).default("monthly"),
  callback_url: z.string().url(),
  build_session_id: z.string().uuid().nullable().optional(),
});

// Map "<slug>_<cycle>" -> env var holding the Paystack plan code for that combination.
// Monthly codes are stored in the DB; yearly codes live in env secrets so admins can
// rotate them without a schema change.
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
    const { plan_slug, billing_cycle, callback_url, build_session_id = null } = parsed.data;
    trace.plan_slug = plan_slug;
    trace.billing_cycle = billing_cycle;
    console.log("[paystack-init]", plan_slug, billing_cycle, "user:", user.id);

    const { data: plan, error: planErr } = await admin
      .from("subscription_plans")
      .select("slug,name,price_cents,currency,monthly_credits,paystack_plan_code,is_active,billing_cycle")
      .eq("slug", plan_slug)
      .eq("billing_cycle", billing_cycle)
      .maybeSingle();

    trace.db_plan = plan;
    trace.db_error = planErr?.message;

    if (planErr) return json({ ok: false, error: "db_error", detail: planErr.message, trace }, 200);
    if (!plan) return json({ ok: false, error: "plan_not_found", detail: `No ${billing_cycle} plan '${plan_slug}'`, trace }, 200);
    if (!plan.is_active) return json({ ok: false, error: "plan_inactive", trace }, 200);

    const amount = Number(plan.price_cents);
    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ ok: false, error: "invalid_amount", trace }, 200);
    }

    // Resolve Paystack plan code: DB (monthly) or env (yearly).
    const paystackPlanCode = plan.paystack_plan_code || envPlanCode(plan_slug, billing_cycle);
    trace.plan_code = paystackPlanCode;
    if (billing_cycle === "yearly" && !paystackPlanCode) {
      return json({
        ok: false,
        error: "missing_yearly_plan_code",
        detail: `Set env secret PAYSTACK_PLAN_${plan_slug.toUpperCase()}_YEARLY to your Paystack yearly plan code.`,
        trace,
      }, 200);
    }

    const reference = `YAIDEV-${plan.slug.toUpperCase()}-${billing_cycle.toUpperCase()}-${user.id.slice(0, 8)}-${Date.now()}`;
    trace.reference = reference;
    trace.amount = amount;
    trace.currency = plan.currency;

    const payload: Record<string, unknown> = {
      email: user.email,
      amount,
      currency: plan.currency,
      reference,
      callback_url,
      metadata: {
        user_id: user.id,
        plan_slug: plan.slug,
        billing_cycle,
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

    let { r: resp, j: out } = await doInit(payload);
    trace.paystack_status = resp.status;
    trace.paystack_response = out;

    if ((!resp.ok || !out.status) && paystackPlanCode) {
      // Retry once without the plan code (works as one-time charge fallback).
      const fallback = { ...payload };
      delete (fallback as any).plan;
      const retry = await doInit(fallback);
      trace.paystack_retry_status = retry.r.status;
      trace.paystack_retry_response = retry.j;
      if (retry.r.ok && retry.j.status) {
        await admin.from("transactions").insert({
          user_id: user.id, plan: plan.slug, provider: "paystack",
          amount_cents: amount, currency: plan.currency, status: "pending",
          reference, coins_added: 0,
        });
        return json({
          ok: true,
          authorization_url: retry.j.data.authorization_url,
          reference: retry.j.data.reference,
          access_code: retry.j.data.access_code,
          warning: "fallback_without_plan_code",
          trace,
        });
      }
      return json({ ok: false, error: retry.j.message || out.message || "paystack_init_failed", detail: { first: out, retry: retry.j }, trace }, 200);
    }

    if (!resp.ok || !out.status) {
      return json({ ok: false, error: out.message || "paystack_init_failed", detail: out, trace }, 200);
    }

    await admin.from("transactions").insert({
      user_id: user.id, plan: plan.slug, provider: "paystack",
      amount_cents: amount, currency: plan.currency, status: "pending",
      reference, coins_added: 0,
    });

    return json({
      ok: true,
      authorization_url: out.data.authorization_url,
      reference: out.data.reference,
      access_code: out.data.access_code,
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
