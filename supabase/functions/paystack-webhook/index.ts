// Paystack webhook — verifies signature and processes charges (initial + recurring) idempotently.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });
  if (!PAYSTACK_SECRET) return new Response("not_configured", { status: 500 });

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";
  const expected = createHmac("sha512", PAYSTACK_SECRET).update(raw).digest("hex");
  if (signature !== expected) return new Response("invalid_signature", { status: 401 });

  let event: any;
  try { event = JSON.parse(raw); } catch { return new Response("bad_json", { status: 400 }); }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const type = event.event as string;
  const data = event.data || {};

  try {
    if (type === "charge.success") {
      await handleChargeSuccess(admin, data);
    } else if (type === "invoice.payment_failed" || type === "subscription.not_renew" || type === "subscription.disable") {
      await handleFailure(admin, data, type);
    } else {
      return new Response("ignored", { status: 200 });
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("[paystack-webhook]", type, e);
    return new Response("error", { status: 500 });
  }
});

async function resolveUserAndPlan(admin: any, data: any) {
  const meta = data.metadata || {};
  let userId = meta.user_id as string | undefined;
  let planSlug = meta.plan_slug as string | undefined;
  let cycle = (meta.billing_cycle === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly";
  const planId = meta.plan_id as string | undefined;

  if (!userId) {
    const email = data.customer?.email;
    if (email) {
      const { data: users } = await admin.auth.admin.listUsers();
      userId = users?.users?.find((u: any) => (u.email || "").toLowerCase() === email.toLowerCase())?.id;
    }
  }

  // Recurring charges carry the Paystack plan code, not our metadata.
  const planCode = data.plan?.plan_code || data.plan_object?.plan_code || (typeof data.plan === "string" ? data.plan : null);
  if ((!planSlug || !meta.billing_cycle) && planCode) {
    const { data: p } = await admin
      .from("subscription_plans").select("slug,billing_cycle")
      .eq("paystack_plan_code", planCode).limit(1).maybeSingle();
    if (p) { planSlug = planSlug || p.slug; cycle = p.billing_cycle; }
  }
  return { userId, planSlug, cycle, planId };
}

async function handleChargeSuccess(admin: any, data: any) {
  const reference = data.reference as string;
  const { userId, planSlug, cycle, planId } = await resolveUserAndPlan(admin, data);
  if (!userId || !planSlug) return;

  const { data: existing } = await admin
    .from("transactions").select("status").eq("reference", reference).maybeSingle();
  if (existing?.status === "success") return;

  // Resolve the EXACT plan row (slug + billing cycle) so coins are never taken
  // from a different tier or interval.
  let planQ = admin.from("subscription_plans").select("slug,name,monthly_credits,billing_cycle");
  planQ = planId ? planQ.eq("id", planId) : planQ.eq("slug", planSlug).eq("billing_cycle", cycle);
  const { data: plan } = await planQ.maybeSingle();
  if (!plan) {
    console.error("[paystack-webhook] plan_not_resolved", { planSlug, cycle, planId, reference });
    return;
  }
  const coins = plan.monthly_credits ?? 0;
  const expires = new Date(Date.now() + (plan.billing_cycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();

  await admin.from("transactions").upsert({
    user_id: userId,
    plan: plan.slug,
    provider: "paystack",
    amount_cents: data.amount,
    currency: data.currency,
    status: "success",
    reference,
    coins_added: coins,
  }, { onConflict: "reference" });

  await admin.from("subscriptions").insert({
    user_id: userId,
    plan: plan.slug,
    status: "active",
    coins_granted: coins,
    billing_cycle: plan.billing_cycle,
    expires_at: expires,
  });

  // Reset paid_balance to the plan allocation (each billing cycle)
  await admin.from("user_credits").update({ paid_balance: coins }).eq("user_id", userId);

  await admin.from("notifications").insert({
    user_id: userId,
    kind: "payment_success",
    title: "Payment received",
    body: `${plan.name} is active. ${coins} AI Coins added.`,
    link: "/dashboard",
  });
}

async function handleFailure(admin: any, data: any, type: string) {
  const { userId, planSlug } = await resolveUserAndPlan(admin, data);
  if (!userId) return;

  const q = admin.from("subscriptions")
    .update({ status: type === "invoice.payment_failed" ? "expired" : "cancelled" })
    .eq("user_id", userId);
  if (planSlug) q.eq("plan", planSlug);
  await q;

  await admin.from("notifications").insert({
    user_id: userId,
    kind: "payment_failed",
    title: type === "invoice.payment_failed" ? "Renewal payment failed" : "Subscription ended",
    body: type === "invoice.payment_failed"
      ? "We couldn't renew your YAIDEV subscription. Premium access is suspended until payment succeeds."
      : "Your YAIDEV subscription has ended. Renew to restore premium access.",
  });
}
