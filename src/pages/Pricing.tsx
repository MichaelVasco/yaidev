import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Crown, Loader2, Sparkles, Zap, ShieldCheck, Rocket, Star, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Plan {
  id: string;
  slug: string;
  name: string;
  price_cents: number;   // in kobo (NGN minor unit)
  currency: string;      // "NGN"
  monthly_credits: number;
  features: string[];
  sort_order: number;
}

type Ccy = "NGN" | "USD" | "EUR" | "GBP";

// Approximate display rates (NGN -> target). Payments always settle in NGN via Paystack.
const RATES: Record<Ccy, number> = {
  NGN: 1,
  USD: 1 / 1600,
  EUR: 1 / 1750,
  GBP: 1 / 2050,
};
const SYMBOL: Record<Ccy, string> = { NGN: "₦", USD: "$", EUR: "€", GBP: "£" };

const ICONS = [Sparkles, Zap, Rocket, Star, Crown, Building2];

const Pricing = () => {
  const navigate = useNavigate();
  const { user, subscription } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [ccy, setCcy] = useState<Ccy>("NGN");

  useEffect(() => {
    supabase.from("subscription_plans")
      .select("id,slug,name,price_cents,currency,monthly_credits,features,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setPlans((data || []) as Plan[]);
        setLoading(false);
      });
  }, []);

  const currentSlug = subscription?.plan as string | undefined;

  const subscribe = async (slug: string) => {
    if (!user) { navigate(`/auth?redirect=/pricing`); return; }
    setPaying(slug);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-init", {
        body: {
          plan_slug: slug,
          callback_url: `${window.location.origin}/payment/success`,
        },
      });
      if (error) throw error;
      const out = data as any;
      if (!out?.ok || !out?.authorization_url) throw new Error(out?.error || "init_failed");
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
            {plans.map((p, i) => {
              const Icon = ICONS[i] || Sparkles;
              const popular = p.slug === "business";
              const isCurrent = currentSlug === p.slug;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={`relative rounded-2xl border-2 p-6 bg-card flex flex-col ${popular ? "border-primary shadow-lg shadow-primary/10" : "border-border"}`}
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full">Most Popular</span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 right-4 bg-teal text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full">Current Plan</span>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={20} className="text-primary" />
                    <h3 className="font-heading font-bold text-lg text-foreground leading-tight">{p.name}</h3>
                  </div>
                  <div className="mb-1">
                    <span className="font-heading font-bold text-3xl text-foreground">{fmt(p.price_cents)}</span>
                    <span className="text-muted-foreground text-sm"> / month</span>
                  </div>
                  {ccy !== "NGN" && (
                    <p className="text-[11px] text-muted-foreground mb-1">Billed in NGN — {`₦${(p.price_cents/100).toLocaleString()}`}</p>
                  )}
                  <p className="text-sm text-primary font-semibold mb-5">{p.monthly_credits.toLocaleString()} AI Coins / month</p>

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
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck size={14} className="text-teal" />
          Secure checkout via Paystack. Cards, bank transfer &amp; mobile money supported. All payments settle in NGN.
        </div>
      </section>
    </div>
  );
};

export default Pricing;
