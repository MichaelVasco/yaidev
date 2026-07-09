import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Crown, Loader2, Sparkles, Zap, ShieldCheck, Rocket, Star, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Cycle = "monthly" | "yearly";

interface Plan {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  currency: string;
  monthly_credits: number;
  features: string[];
  sort_order: number;
  billing_cycle: Cycle;
}

type Ccy = "NGN" | "USD" | "EUR" | "GBP";

// Display-only FX rates (NGN -> target). Payments always settle in NGN via Paystack.
const RATES: Record<Ccy, number> = { NGN: 1, USD: 1 / 1600, EUR: 1 / 1750, GBP: 1 / 2050 };
const SYMBOL: Record<Ccy, string> = { NGN: "₦", USD: "$", EUR: "€", GBP: "£" };
const ICONS = [Sparkles, Zap, Rocket, Star, Crown, Building2];

const Pricing = () => {
  const navigate = useNavigate();
  const { user, subscription } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [ccy, setCcy] = useState<Ccy>("NGN");
  const [cycle, setCycle] = useState<Cycle>("monthly");

  useEffect(() => {
    supabase.from("subscription_plans")
      .select("id,slug,name,price_cents,currency,monthly_credits,features,sort_order,billing_cycle")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setPlans((data || []) as Plan[]);
        setLoading(false);
      });
  }, []);

  const currentSlug = subscription?.plan as string | undefined;
  const visiblePlans = useMemo(() => plans.filter(p => p.billing_cycle === cycle), [plans, cycle]);

  const subscribe = async (slug: string) => {
    if (!user) { navigate(`/auth?redirect=/pricing`); return; }
    setPaying(slug);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-init", {
        body: {
          plan_slug: slug,
          billing_cycle: cycle,
          callback_url: `${window.location.origin}/payment/success`,
        },
      });
      if (error) {
        const ctx: any = (error as any).context;
        let detail = error.message;
        try {
          const body = ctx?.body ? await ctx.body : null;
          if (body) detail = typeof body === "string" ? body : JSON.stringify(body);
        } catch {}
        throw new Error(detail);
      }
      const out = data as any;
      if (!out?.ok || !out?.authorization_url) {
        throw new Error(out?.error ? `${out.error}${out?.detail ? ` — ${typeof out.detail === "string" ? out.detail : JSON.stringify(out.detail)}` : ""}` : "init_failed");
      }
      window.location.href = out.authorization_url;
    } catch (e: any) {
      toast.error(e?.message || "Could not start checkout");
      setPaying(null);
    }
  };

  const fmt = useMemo(() => (kobo: number) => {
    const ngn = kobo / 100;
    const val = ngn * RATES[ccy];
    if (ccy === "NGN") return `${SYMBOL[ccy]}${val.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
    return `${SYMBOL[ccy]}${val.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }, [ccy]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Back
          </Link>
          {user && <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>}
        </div>
      </div>

      <section className="container mx-auto px-4 lg:px-8 py-12 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase mb-3">YAIDEV Plans</span>
          <h1 className="font-heading font-bold text-3xl md:text-5xl text-foreground mb-3">Build without limits</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Pick the plan that fits your workflow. Every plan includes AI Coins that renew each billing cycle.</p>
        </motion.div>

        {/* Monthly / Yearly toggle */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border bg-card">
            {(["monthly", "yearly"] as Cycle[]).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors capitalize ${cycle === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {c}
                {c === "yearly" && (
                  <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded-full bg-teal/20 text-teal text-[9px] font-bold">-5%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Currency selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border bg-card">
            {(["NGN", "USD", "EUR", "GBP"] as Ccy[]).map((c) => (
              <button
                key={c}
                onClick={() => setCcy(c)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${ccy === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visiblePlans.map((p, i) => {
              const Icon = ICONS[i] || Sparkles;
              const popular = p.slug === "business";
              const isCurrent = currentSlug === p.slug;
              const per = cycle === "yearly" ? "year" : "month";
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={`relative rounded-2xl border-2 p-6 bg-card flex flex-col ${popular ? "border-primary shadow-lg shadow-primary/10" : "border-border"}`}
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full">Most Popular</span>
                  )}
                  {cycle === "yearly" && (
                    <span className="absolute -top-3 right-4 bg-teal text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full">Save 5%</span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 left-4 bg-foreground text-background text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full">Current</span>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={20} className="text-primary" />
                    <h3 className="font-heading font-bold text-lg text-foreground leading-tight">{p.name}</h3>
                  </div>
                  <div className="mb-1">
                    <span className="font-heading font-bold text-3xl text-foreground">{fmt(p.price_cents)}</span>
                    <span className="text-muted-foreground text-sm"> / {per}</span>
                  </div>
                  {ccy !== "NGN" && (
                    <p className="text-[11px] text-muted-foreground mb-1">Billed in NGN — {`₦${(p.price_cents/100).toLocaleString()}`}</p>
                  )}
                  <p className="text-sm text-primary font-semibold mb-5">
                    {p.monthly_credits.toLocaleString()} AI Coins / {per}
                  </p>

                  <ul className="space-y-2 mb-6 flex-1">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                        <Check size={16} className="text-teal flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => subscribe(p.slug)}
                    disabled={paying === p.slug || isCurrent}
                    className={`w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      isCurrent
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : popular
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-foreground text-background hover:opacity-90"
                    } disabled:opacity-60`}
                  >
                    {paying === p.slug && <Loader2 className="animate-spin" size={16} />}
                    {isCurrent ? "Active plan" : paying === p.slug ? "Redirecting…" : `Subscribe`}
                  </button>
                </motion.div>
              );
            })}
            {visiblePlans.length === 0 && (
              <div className="col-span-full text-center py-10 text-sm text-muted-foreground">
                No {cycle} plans available yet.
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground text-center">
          <ShieldCheck size={14} className="text-teal" />
          Secure checkout via Paystack. Cards, bank transfer &amp; mobile money supported. All payments settle in NGN.
        </div>
      </section>
    </div>
  );
};

export default Pricing;
