// Paystack webhook receiver — verifies signature and activates plan idempotently.
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

  if (event.event !== "charge.success") return new Response("ignored", { status: 200 });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const data = event.data;
  const reference = data.reference as string;
  const meta = data.metadata || {};
  const userId = meta.user_id;
  const planSlug = meta.plan_slug;
  if (!userId || !planSlug) return new Response("missing_meta", { status: 400 });

  // Idempotency
  const { data: existing } = await admin
    .from("transactions").select("status").eq("reference", reference).maybeSingle();
  if (existing?.status === "success") return new Response("already_processed", { status: 200 });

  const { data: plan } = await admin
    .from("subscription_plans").select("monthly_credits").eq("slug", planSlug).maybeSingle();
  const coins = plan?.monthly_credits ?? 0;

  // Upsert transaction
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

  // Add credits
  const { data: cur } = await admin.from("user_credits").select("paid_balance").eq("user_id", userId).maybeSingle();
  await admin.from("user_credits").update({
    paid_balance: (cur?.paid_balance ?? 0) + coins,
  }).eq("user_id", userId);

  await admin.from("notifications").insert({
    user_id: userId,
    type: "payment_success",
    title: "Payment received",
    body: `Your ${planSlug} plan is now active. ${coins} credits added.`,
  });

  return new Response("ok", { status: 200 });
});
