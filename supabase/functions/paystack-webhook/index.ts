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

  if (!userId) {
    const email = data.customer?.email;
    if (email) {
      const { data: users } = await admin.auth.admin.listUsers();
      userId = users?.users?.find((u: any) => (u.email || "").toLowerCase() === email.toLowerCase())?.id;
    }
  }
  if (!planSlug) {
    const planCode = data.plan?.plan_code || data.plan_object?.plan_code;
    if (planCode) {
      const { data: p } = await admin.from("subscription_plans").select("slug").eq("paystack_plan_code", planCode).maybeSingle();
      planSlug = p?.slug;
    }
  }
  return { userId, planSlug };
}

async function handleChargeSuccess(admin: any, data: any) {
  const reference = data.reference as string;
  const { userId, planSlug } = await resolveUserAndPlan(admin, data);
  if (!userId || !planSlug) return;

  const { data: existing } = await admin
    .from("transactions").select("status").eq("reference", reference).maybeSingle();
  if (existing?.status === "success") return;

  const { data: plan } = await admin
    .from("subscription_plans").select("monthly_credits").eq("slug", planSlug).maybeSingle();
  const coins = plan?.monthly_credits ?? 0;

  await admin.from("transactions").upsert({
    user_id: userId,
    plan: planSlug,
    provider: "paystack",
    amount_cents: data.amount,
    currency: data.currency,
    status: "success",
    reference,
    coins_added: coins,
  }, { onConflict: "reference" });

  await admin.from("subscriptions").insert({
    user_id: userId,
    plan: planSlug,
    status: "active",
    coins_granted: coins,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Reset paid_balance to the plan allocation (each billing cycle)
  await admin.from("user_credits").update({ paid_balance: coins }).eq("user_id", userId);

  await admin.from("notifications").insert({
    user_id: userId,
    type: "payment_success",
    title: "Payment received",
    body: `Your ${planSlug} plan is active. ${coins} AI Coins added.`,
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
    type: "payment_failed",
    title: type === "invoice.payment_failed" ? "Renewal payment failed" : "Subscription ended",
    body: type === "invoice.payment_failed"
      ? "We couldn't renew your YAIDEV subscription. Premium access is suspended until payment succeeds."
      : "Your YAIDEV subscription has ended. Renew to restore premium access.",
  });
}
