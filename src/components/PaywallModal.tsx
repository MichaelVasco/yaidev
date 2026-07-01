import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Check, AlertTriangle, Loader2, Sparkles, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Plan {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  monthly_credits: number;
  features: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  reason?: "out_of_coins" | "upgrade";
}

const PaywallModal = ({ open, onClose, reason = "upgrade" }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    supabase.from("subscription_plans")
      .select("id,slug,name,price_cents,monthly_credits,features")
      .eq("is_active", true).order("sort_order")
      .then(({ data }) => { setPlans((data || []) as Plan[]); setLoading(false); });
  }, [open]);

  const subscribe = async (slug: string) => {
    if (!user) { navigate("/auth?redirect=/pricing"); return; }
    setPaying(slug);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-init", {
        body: { plan_slug: slug, callback_url: `${window.location.origin}/payment/success` },
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

  if (!open) return null;

  const icons = [Sparkles, Zap, Crown];

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
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-primary" />
              <h3 className="font-heading font-bold text-foreground">
                {reason === "out_of_coins" ? "You've exhausted your free credits" : "Upgrade your plan"}
              </h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>

          <div className="p-5">
            {reason === "out_of_coins" && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-5 flex items-start gap-2 text-sm">
                <AlertTriangle size={16} className="text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-foreground">You've used all your daily free credits. Pick a plan to keep generating.</p>
              </div>
            )}

            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {plans.map((p, i) => {
                  const Icon = icons[i % icons.length] || Sparkles;
                  const popular = p.slug === "business";
                  return (
                    <div key={p.id} className={`rounded-xl border-2 p-4 flex flex-col ${popular ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={16} className="text-primary" />
                        <p className="font-heading font-bold text-foreground text-sm">{p.name}</p>
                      </div>
                      <p className="font-heading font-bold text-2xl text-foreground">₦{((p.price_cents / 100)).toLocaleString()}<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
                      <p className="text-xs text-primary font-semibold mb-3">{p.monthly_credits.toLocaleString()} AI Coins</p>
                      <ul className="space-y-1 text-[12px] mb-4 flex-1">
                        {p.features.slice(0, 4).map((f, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-foreground"><Check size={12} className="text-teal mt-0.5 flex-shrink-0" /><span>{f}</span></li>
                        ))}
                      </ul>
                      <button
                        onClick={() => subscribe(p.slug)}
                        disabled={paying === p.slug}
                        className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {paying === p.slug && <Loader2 className="animate-spin" size={12} />}
                        Subscribe
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-center mt-4">
              <Link to="/pricing" onClick={onClose} className="text-xs text-primary hover:underline">Compare all plans →</Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaywallModal;
