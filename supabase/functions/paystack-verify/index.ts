import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const BodySchema = z.object({ reference: z.string().min(4).max(200) });

const MISMATCH_MSG = "Payment plan mismatch. Your subscription was not activated. Please try again.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!PAYSTACK_SECRET) return json({ ok: false, error: "Paystack not configured" }, 200);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ ok: false, error: "unauthorized" }, 200);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData.user) return json({ ok: false, error: "unauthorized" }, 200);
    const user = userData.user;

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ ok: false, error: "invalid_body" }, 200);
    const { reference } = parsed.data;

    // Idempotency: already activated.
    const { data: existing } = await admin
      .from("transactions").select("status,plan,coins_added,amount_cents,currency")
      .eq("reference", reference).eq("user_id", user.id).maybeSingle();
    if (existing?.status === "success") {
      return json({ ok: true, already: true, plan: existing.plan, coins_added: existing.coins_added });
    }

    const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const out = await r.json();
    if (!r.ok || !out.status || out.data?.status !== "success") {
      await admin.from("transactions").update({ status: "failed" }).eq("reference", reference).eq("user_id", user.id);
      return json({ ok: false, error: "verification_failed", detail: out.message }, 200);
    }

    const meta = out.data.metadata || {};
    if (meta.user_id && meta.user_id !== user.id) {
      return json({ ok: false, error: "user_mismatch" }, 200);
    }
    const planSlug = meta.plan_slug as string | undefined;
    const billingCycle = (meta.billing_cycle === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly";
    if (!planSlug) return json({ ok: false, error: "missing_plan" }, 200);

    // ---- Resolve the exact YAIDEV plan the user selected ----
    let planQ = admin
      .from("subscription_plans")
      .select("id,slug,name,price_cents,currency,monthly_credits,paystack_plan_code,billing_cycle");
    planQ = meta.plan_id
      ? planQ.eq("id", meta.plan_id)
      : planQ.eq("slug", planSlug).eq("billing_cycle", billingCycle);
    const { data: plan } = await planQ.maybeSingle();
    if (!plan) return json({ ok: false, error: "plan_not_found" }, 200);

    const expectedCode = (plan.paystack_plan_code || meta.plan_code || null) as string | null;
    const paidCode = out.data.plan_object?.plan_code || out.data.plan?.plan_code || out.data.plan || null;
    const paidAmount = Number(out.data.amount);

    const mismatches: string[] = [];
    if (plan.slug !== planSlug || plan.billing_cycle !== billingCycle) mismatches.push("plan_identity");
    if (typeof paidCode === "string" && expectedCode && paidCode !== expectedCode) mismatches.push("plan_code");
    if (Number.isFinite(paidAmount) && paidAmount !== Number(plan.price_cents)) mismatches.push("amount");
    if (out.data.currency && plan.currency && out.data.currency !== plan.currency) mismatches.push("currency");

    if (mismatches.length) {
      console.error("[paystack-verify] MISMATCH", { reference, user: user.id, mismatches, expectedCode, paidCode, paidAmount, expected: plan.price_cents });
      await admin.from("transactions").update({ status: "failed" }).eq("reference", reference).eq("user_id", user.id);
      await admin.from("activity_logs").insert({
        user_id: user.id, module: "billing", action: "plan_mismatch",
        metadata: { reference, mismatches, expected_code: expectedCode, paid_code: paidCode, paid_amount: paidAmount, expected_amount: plan.price_cents, plan_slug: plan.slug, billing_cycle: billingCycle },
      });
      return json({ ok: false, error: MISMATCH_MSG, code: "plan_mismatch", mismatches }, 200);
    }

    // Activate via user-scoped client so activate_plan's auth.uid() check passes.
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: act, error: actErr } = await userClient.rpc("activate_plan", {
      _user_id: user.id,
      _plan: plan.slug,
      _provider: "paystack",
      _amount_cents: paidAmount,
      _currency: out.data.currency,
      _reference: reference,
      _cycle: billingCycle,
    });
    if (actErr) return json({ ok: false, error: actErr.message }, 200);

    await admin.from("notifications").insert({
      user_id: user.id,
      kind: "payment_success",
      title: "Payment received",
      body: `${plan.name} is now active. ${(act as any)?.coins_added ?? plan.monthly_credits} AI Coins added.`,
      link: "/dashboard",
    });

    return json({
      ok: true,
      activation: act,
      plan: { id: plan.id, slug: plan.slug, name: plan.name, billing_cycle: billingCycle, coins: plan.monthly_credits },
      build_session_id: meta.build_session_id ?? null,
    });
  } catch (e) {
    console.error("[paystack-verify] exception", e);
    return json({ ok: false, error: String(e) }, 200);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
