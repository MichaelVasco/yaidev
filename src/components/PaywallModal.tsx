import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Sparkles, Check, Loader2, Infinity as InfinityIcon, AlertTriangle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PlanId = "pro" | "enterprise" | "forever";
export type Provider = "paystack" | "stripe" | "flutterwave";

interface Props {
  open: boolean;
  onClose: () => void;
  reason?: "out_of_coins" | "upgrade";
}

const PLANS: { id: PlanId; name: string; coins: string; price: number; tagline: string; highlight?: boolean }[] = [
  { id: "pro",        name: "YAIDEV Pro",        coins: "300 coins",          price: 9.99,  tagline: "Great for daily creators" },
  { id: "enterprise", name: "YAIDEV Enterprise", coins: "1,000 coins",        price: 29.99, tagline: "For teams & power users", highlight: true },
  { id: "forever",    name: "Forever Plan",      coins: "Unlimited lifetime", price: 99.99, tagline: "One-time, never pay again" },
];

const PROVIDERS: { id: Provider; name: string; tint: string }[] = [
  { id: "paystack",    name: "Paystack",    tint: "bg-[#00C3F7]" },
  { id: "stripe",      name: "Stripe",      tint: "bg-[#635BFF]" },
  { id: "flutterwave", name: "Flutterwave", tint: "bg-[#F5A623]" },
];

const PaywallModal = ({ open, onClose, reason = "upgrade" }: Props) => {
  const { user, refreshAll } = useAuth();
  const [step, setStep] = useState<"plans" | "pay" | "success">("plans");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("enterprise");
  const [provider, setProvider] = useState<Provider>("stripe");
  const [processing, setProcessing] = useState(false);

  const plan = PLANS.find(p => p.id === selectedPlan)!;

  const handlePay = async () => {
    if (!user) { toast.error("Please sign in first"); return; }
    setProcessing(true);
    // ─── DEMO MODE ─── Simulate a payment provider checkout. Replace with real
    // server-side webhook + activation flow when keys are added.
    await new Promise(r => setTimeout(r, 1400));

    const { data, error } = await supabase.rpc("activate_plan", {
      _user_id: user.id,
      _plan: selectedPlan,
      _provider: provider,
      _amount_cents: Math.round(plan.price * 100),
      _currency: "USD",
      _reference: `DEMO-${provider.toUpperCase()}-${Date.now()}`,
    });
    setProcessing(false);
    if (error || !(data as any)?.ok) {
      toast.error("Payment activation failed. Please try again.");
      return;
    }
    await refreshAll();
    setStep("success");
    toast.success("Plan activated — coins added to your balance");
  };

  const handleClose = () => {
    setStep("plans"); setProcessing(false); onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-primary" />
              <h3 className="font-heading font-bold text-foreground">
                {step === "success" ? "You're all set" : reason === "out_of_coins" ? "You're out of coins" : "Upgrade your plan"}
              </h3>
            </div>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>

          <div className="p-5">
            {step === "plans" && (
              <>
                {reason === "out_of_coins" && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4 flex items-start gap-2 text-sm">
                    <AlertTriangle size={16} className="text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-foreground">You've used all your daily free coins. Pick a plan to keep generating.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                  {PLANS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlan(p.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all relative ${
                        selectedPlan === p.id ? "border-primary bg-primary/5 shadow-md shadow-blue/10" : "border-border hover:border-primary/30"
                      }`}
                    >
                      {p.highlight && <span className="absolute -top-2 right-3 text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">Popular</span>}
                      <p className="font-heading font-bold text-foreground text-sm">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground mb-2">{p.tagline}</p>
                      <p className="flex items-center gap-1 text-foreground font-semibold text-sm">
                        {p.id === "forever" ? <InfinityIcon size={14} className="text-blue" /> : null}
                        {p.coins}
                      </p>
                      <p className="mt-2 font-heading font-bold text-xl text-foreground">${p.price}</p>
                      <p className="text-[10px] text-muted-foreground">{p.id === "forever" ? "one-time" : "/ month"}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep("pay")}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90"
                >
                  Continue to checkout
                </button>
              </>
            )}

            {step === "pay" && (
              <>
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Order summary</span>
                    <button onClick={() => setStep("plans")} className="text-[11px] text-primary hover:underline">Change</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-heading font-bold text-foreground">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.coins}</p>
                    </div>
                    <p className="font-heading font-bold text-xl text-foreground">${plan.price}</p>
                  </div>
                </div>

                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Choose a payment method</p>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {PROVIDERS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setProvider(p.id)}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1.5 ${provider === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                    >
                      <span className={`w-7 h-7 rounded-full ${p.tint} flex items-center justify-center text-white text-[10px] font-bold`}>
                        {p.name[0]}
                      </span>
                      <span className="text-xs font-medium text-foreground">{p.name}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-muted/40 rounded-lg p-3 mb-5 text-[11px] text-muted-foreground flex items-start gap-2">
                  <ShieldCheck size={14} className="text-teal flex-shrink-0 mt-0.5" />
                  <span><strong className="text-foreground">Demo mode:</strong> no real charge is made. Live keys can be plugged in later — your plan and coins will activate immediately on success.</span>
                </div>

                <button
                  onClick={handlePay}
                  disabled={processing}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing && <Loader2 className="animate-spin" size={16} />}
                  {processing ? "Processing payment…" : `Pay $${plan.price} with ${PROVIDERS.find(p => p.id === provider)?.name}`}
                </button>
              </>
            )}

            {step === "success" && (
              <div className="text-center py-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                  className="w-14 h-14 rounded-full bg-teal/15 flex items-center justify-center mx-auto mb-4">
                  <Check size={28} className="text-teal" />
                </motion.div>
                <h4 className="font-heading font-bold text-xl text-foreground mb-1">Payment successful</h4>
                <p className="text-sm text-muted-foreground mb-5">
                  Your <strong className="text-foreground">{plan.name}</strong> is now active.
                </p>
                <button onClick={handleClose} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
                  Start building
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaywallModal;
