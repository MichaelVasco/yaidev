import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const BodySchema = z.object({ reference: z.string().min(4).max(200) });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!PAYSTACK_SECRET) return json({ error: "Paystack not configured" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
    const user = userData.user;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const { reference } = parsed.data;

    // Idempotency: if already successful, return current state
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
      return json({ ok: false, error: "verification_failed", detail: out.message }, 400);
    }

    const meta = out.data.metadata || {};
    if (meta.user_id && meta.user_id !== user.id) {
      return json({ ok: false, error: "user_mismatch" }, 403);
    }
    const planSlug = meta.plan_slug as string;
    if (!planSlug) return json({ ok: false, error: "missing_plan" }, 400);

    // Activate via user-scoped client so activate_plan's auth.uid() check passes
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: act, error: actErr } = await userClient.rpc("activate_plan", {
      _user_id: user.id,
      _plan: planSlug,
      _provider: "paystack",
      _amount_cents: out.data.amount,
      _currency: out.data.currency,
      _reference: reference,
    });
    if (actErr) return json({ ok: false, error: actErr.message }, 500);

    // Notify in-app
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "payment_success",
      title: "Payment received",
      body: `Your ${planSlug} plan is now active. ${(act as any)?.coins_added ?? 0} credits added.`,
    });

    return json({ ok: true, activation: act });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
