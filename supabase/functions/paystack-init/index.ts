import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BodySchema = z.object({
  plan_slug: z.enum(["starter", "professional", "business"]),
  callback_url: z.string().url(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!PAYSTACK_SECRET) {
      return json({ error: "Paystack not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
    const user = userData.user;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const { plan_slug, callback_url } = parsed.data;

    const { data: plan, error: planErr } = await admin
      .from("subscription_plans")
      .select("slug,name,price_cents,currency,monthly_credits")
      .eq("slug", plan_slug)
      .eq("is_active", true)
      .maybeSingle();
    if (planErr || !plan) return json({ error: "plan_not_found" }, 404);

    const reference = `YAIDEV-${plan.slug.toUpperCase()}-${user.id.slice(0, 8)}-${Date.now()}`;

    // Paystack expects amount in lowest currency unit (kobo for NGN, cents for USD)
    const resp = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: plan.price_cents,
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
      }),
    });

    const out = await resp.json();
    if (!resp.ok || !out.status) {
      return json({ error: out.message || "paystack_init_failed", detail: out }, 502);
    }

    // Record pending transaction
    await admin.from("transactions").insert({
      user_id: user.id,
      plan: plan.slug,
      provider: "paystack",
      amount_cents: plan.price_cents,
      currency: plan.currency,
      status: "pending",
      reference,
      coins_added: 0,
    });

    return json({
      ok: true,
      authorization_url: out.data.authorization_url,
      reference: out.data.reference,
      access_code: out.data.access_code,
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
