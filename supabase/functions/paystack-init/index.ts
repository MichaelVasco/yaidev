import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BodySchema = z.object({
  plan_slug: z.string().min(2).max(64),
  callback_url: z.string().url(),
});

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
      console.error("[paystack-init] body validation failed", parsed.error.flatten());
      return json({ ok: false, error: "invalid_body", detail: parsed.error.flatten(), trace }, 200);
    }
    const { plan_slug, callback_url } = parsed.data;
    trace.plan_slug = plan_slug;
    console.log("[paystack-init] incoming plan:", plan_slug, "user:", user.id);

    const { data: plan, error: planErr } = await admin
      .from("subscription_plans")
      .select("slug,name,price_cents,currency,monthly_credits,paystack_plan_code,is_active")
      .eq("slug", plan_slug)
      .maybeSingle();

    trace.db_plan = plan;
    trace.db_error = planErr?.message;
    console.log("[paystack-init] db plan lookup:", JSON.stringify(plan), "err:", planErr?.message);

    if (planErr) return json({ ok: false, error: "db_error", detail: planErr.message, trace }, 200);
    if (!plan) return json({ ok: false, error: "plan_not_found", detail: `No plan with slug '${plan_slug}'`, trace }, 200);
    if (!plan.is_active) return json({ ok: false, error: "plan_inactive", detail: `Plan '${plan_slug}' is inactive`, trace }, 200);

    const amount = Number(plan.price_cents);
    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ ok: false, error: "invalid_amount", detail: `Amount ${plan.price_cents} is invalid`, trace }, 200);
    }

    const reference = `YAIDEV-${plan.slug.toUpperCase()}-${user.id.slice(0, 8)}-${Date.now()}`;
    trace.reference = reference;
    trace.plan_code = plan.paystack_plan_code;
    trace.amount = amount;
    trace.currency = plan.currency;

    // Paystack: when `plan` is passed, the plan's own amount is used; still send amount for parity.
    const payload: Record<string, unknown> = {
      email: user.email,
      amount,
      currency: plan.currency,
      reference,
      callback_url,
      metadata: {
        user_id: user.id,
        plan_slug: plan.slug,
        custom_fields: [
          { display_name: "Plan", variable_name: "plan", value: plan.name },
          { display_name: "Credits", variable_name: "credits", value: String(plan.monthly_credits) },
        ],
      },
    };
    if (plan.paystack_plan_code) payload.plan = plan.paystack_plan_code;

    console.log("[paystack-init] paystack payload:", JSON.stringify({ ...payload, email: "***" }));

    const resp = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const out = await resp.json().catch(() => ({}));
    trace.paystack_status = resp.status;
    trace.paystack_response = out;
    console.log("[paystack-init] paystack response status:", resp.status, "body:", JSON.stringify(out));

    if (!resp.ok || !out.status) {
      // Retry once WITHOUT the plan code (in case that specific Paystack plan is misconfigured)
      // — this keeps the flow working like a one-time charge, matching other plans' fallback behavior.
      if (plan.paystack_plan_code) {
        console.warn("[paystack-init] retrying without plan code for", plan.slug);
        const fallbackPayload = { ...payload };
        delete (fallbackPayload as any).plan;
        const r2 = await fetch("https://api.paystack.co/transaction/initialize", {
          method: "POST",
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
          body: JSON.stringify(fallbackPayload),
        });
        const out2 = await r2.json().catch(() => ({}));
        trace.paystack_retry_status = r2.status;
        trace.paystack_retry_response = out2;
        console.log("[paystack-init] retry response:", r2.status, JSON.stringify(out2));
        if (r2.ok && out2.status) {
          await admin.from("transactions").insert({
            user_id: user.id, plan: plan.slug, provider: "paystack",
            amount_cents: amount, currency: plan.currency, status: "pending",
            reference, coins_added: 0,
          });
          return json({
            ok: true,
            authorization_url: out2.data.authorization_url,
            reference: out2.data.reference,
            access_code: out2.data.access_code,
            warning: "fallback_without_plan_code",
            trace,
          });
        }
        return json({ ok: false, error: out2.message || out.message || "paystack_init_failed", detail: { first: out, retry: out2 }, trace }, 200);
      }
      return json({ ok: false, error: out.message || "paystack_init_failed", detail: out, trace }, 200);
    }

    const { error: txErr } = await admin.from("transactions").insert({
      user_id: user.id,
      plan: plan.slug,
      provider: "paystack",
      amount_cents: amount,
      currency: plan.currency,
      status: "pending",
      reference,
      coins_added: 0,
    });
    if (txErr) {
      console.error("[paystack-init] tx insert failed:", txErr.message);
      trace.tx_insert_error = txErr.message;
    }

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
