import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Check, Lock, Loader2, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const RESUME_BUILD_KEY = "yaidev:resumeBuild";

interface Plan {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  currency: string;
  monthly_credits: number;
  features: string[];
  billing_cycle: "monthly" | "yearly";
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Why the paywall appeared — drives the headline copy. */
  reason?: "out_of_coins" | "upgrade" | "complete_build" | "preview_limit";
  /** Build session to resume automatically once payment succeeds. */
  buildSessionId?: string | null;
  /** What the user was building, shown in the header for context. */
  buildLabel?: string;
}

const HEADLINES: Record<string, { title: string; body: string }> = {
  complete_build: {
    title: "Subscribe to complete your build",
    body: "Your preview is ready. Choose a plan to unlock the complete, production-ready deliverable — your build resumes automatically right where it stopped.",
  },
  preview_limit: {
    title: "Free previews used up for today",
    body: "You've reached today's preview limit. Subscribe to build without limits — your current work is saved and will resume after payment.",
  },
  out_of_coins: {
    title: "You're out of YAIDEV AI Coins",
    body: "Renew or upgrade your plan to keep building. Your saved builds stay intact.",
  },
  upgrade: {
    title: "Choose your YAIDEV plan",
    body: "Every plan includes full access to the YAIDEV AI Builder and a monthly allocation of AI Coins.",
  },
};

type Ccy = "NGN" | "USD" | "EUR" | "GBP";
// Display-only FX rates (NGN -> target). Payment always settles in the plan's
// Paystack currency; changing the display currency never changes the plan.
const RATES: Record<Ccy, number> = { NGN: 1, USD: 1 / 1600, EUR: 1 / 1750, GBP: 1 / 2050 };
const SYMBOL: Record<Ccy, string> = { NGN: "₦", USD: "$", EUR: "€", GBP: "£" };

const PaywallModal = ({ open, onClose, reason = "upgrade", buildSessionId = null, buildLabel }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [ccy, setCcy] = useState<Ccy>("NGN");
  const [loading, setLoading] = useState(true);
  // Single source of truth for the checkout selection: the plan row id.
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Reset all temporary checkout state whenever the modal opens.
    setSelectedPlanId(null);
    setPaying(false);
    setCycle("monthly");
    setLoading(true);
    supabase.from("subscription_plans")
      .select("id,slug,name,price_cents,currency,monthly_credits,features,billing_cycle")
      .eq("is_active", true).order("sort_order")
      .then(({ data }) => { setPlans((data || []) as unknown as Plan[]); setLoading(false); });
  }, [open]);

  // Switching interval invalidates any previously selected plan.
  useEffect(() => { setSelectedPlanId(null); }, [cycle]);

  const visible = useMemo(() => plans.filter((p) => p.billing_cycle === cycle), [plans, cycle]);

  const fmt = (kobo: number, currency: string) => {
    const base = kobo / 100;
    if (currency !== "NGN") return `${base.toLocaleString()} ${currency}`;
    const val = base * RATES[ccy];
    return `${SYMBOL[ccy]}${val.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  };

  const subscribe = async (plan: Plan) => {
    if (!user) { navigate("/auth?redirect=/pricing"); return; }
    // Explicitly set the selection before checkout so stale state can never leak.
    setSelectedPlanId(plan.id);
    setPaying(true);
    try {
      // Remember the in-flight build so it resumes after the payment redirect.
      try {
        if (buildSessionId) localStorage.setItem(RESUME_BUILD_KEY, buildSessionId);
        else localStorage.removeItem(RESUME_BUILD_KEY);
      } catch { /* storage unavailable */ }

      const { data, error } = await supabase.functions.invoke("paystack-init", {
        body: {
          plan_id: plan.id,
          plan_slug: plan.slug,
          billing_cycle: plan.billing_cycle,
          build_session_id: buildSessionId,
          display_currency: ccy,
          callback_url: `${window.location.origin}/payment/success`,
        },
      });
      if (error) {
        const ctx: any = (error as any).context;
        let detail = error.message;
        try {
          const body = ctx?.body ? await ctx.body : null;
          if (body) detail = typeof body === "string" ? body : JSON.stringify(body);
        } catch { /* ignore */ }
        throw new Error(detail);
      }
      const out = data as any;
      if (!out?.ok || !out?.authorization_url) {
        throw new Error(out?.error ? `${out.error}${out?.detail ? ` — ${typeof out.detail === "string" ? out.detail : JSON.stringify(out.detail)}` : ""}` : "Could not start checkout");
      }
      window.location.href = out.authorization_url;
    } catch (e: any) {
      console.error("[subscribe] error:", e);
      toast.error(e?.message || "Could not start checkout");
      setPaying(false);
      setSelectedPlanId(null);
    }
  };

  if (!open) return null;

  const copy = HEADLINES[reason] || HEADLINES.upgrade;
  const icons = [Sparkles, Zap, Crown, ShieldCheck];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto"
        >
          <div className="flex items-start justify-between gap-4 p-5 border-b border-border">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lock size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-foreground">{copy.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{copy.body}</p>
                {buildLabel && (
                  <p className="text-[11px] text-primary mt-1.5 font-medium">Saved build: {buildLabel}</p>
                )}
              </div>
            </div>
            <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>

          <div className="p-5">
            <div className="flex justify-center mb-5">
              <div className="inline-flex rounded-full border border-border p-1 bg-muted/40">
                {(["monthly", "yearly"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCycle(c)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${cycle === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {c}{c === "yearly" ? " · save 5%" : ""}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center mb-5">
              <div className="inline-flex rounded-full border border-border p-1 bg-muted/40">
                {(["NGN", "USD", "EUR", "GBP"] as Ccy[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCcy(c)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${ccy === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {visible.map((p, i) => {
                  const Icon = icons[i % icons.length] || Sparkles;
                  const popular = p.slug === "business";
                  const isSelected = selectedPlanId === p.id;
                  return (
                    <div key={p.id} className={`rounded-xl border-2 p-4 flex flex-col ${isSelected ? "border-primary ring-2 ring-primary/30" : popular ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={16} className="text-primary" />
                        <p className="font-heading font-bold text-foreground text-sm">{p.name}</p>
                      </div>
                      <p className="font-heading font-bold text-2xl text-foreground">
                        {fmt(p.price_cents, p.currency)}
                        <span className="text-xs text-muted-foreground font-normal">/{p.billing_cycle === "yearly" ? "yr" : "mo"}</span>
                      </p>
                      {ccy !== "NGN" && p.currency === "NGN" && (
                        <p className="text-[10px] text-muted-foreground">Billed in NGN — ₦{(p.price_cents / 100).toLocaleString()}</p>
                      )}
                      <p className="text-xs text-primary font-semibold mb-3">{p.monthly_credits.toLocaleString()} AI Coins</p>
                      <ul className="space-y-1 text-[12px] mb-4 flex-1">
                        {(p.features || []).slice(0, 4).map((f, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-foreground"><Check size={12} className="text-teal mt-0.5 flex-shrink-0" /><span>{f}</span></li>
                        ))}
                      </ul>
                      <button
                        onClick={() => subscribe(p)}
                        disabled={paying}
                        className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {paying && isSelected && <Loader2 className="animate-spin" size={12} />}
                        {paying && isSelected ? "Redirecting…" : "Subscribe & continue build"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}


            <p className="text-center text-[11px] text-muted-foreground mt-4">
              Secure payment by Paystack · Cards, bank transfer & USSD · Cancel anytime
            </p>
            <div className="text-center mt-2">
              <Link to="/pricing" onClick={onClose} className="text-xs text-primary hover:underline">Compare all plans →</Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaywallModal;
