import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Crown, CreditCard, Upload, CheckCircle2, Sparkles,
  Lock, AlertTriangle, Clock
} from "lucide-react";
import type { SubscriptionPlan, PendingPayment, AccessStatus } from "@/hooks/use-credits";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  accessStatus: AccessStatus;
  credits: number;
  pending: PendingPayment | null;
  onActivateVip: (email: string) => boolean;
  onSubmitPayment: (payment: PendingPayment) => void;
}

const plans: { id: SubscriptionPlan; label: string; price: string; period: string; savings?: string }[] = [
  { id: "monthly", label: "1 Month All Access", price: "$10", period: "/month" },
  { id: "yearly", label: "1 Year All Access", price: "$100", period: "/year", savings: "Save $20" },
];

const PaywallModal = ({
  open, onClose, accessStatus, credits, pending,
  onActivateVip, onSubmitPayment
}: PaywallModalProps) => {
  const [step, setStep] = useState<"plans" | "payment" | "form" | "pending" | "vip-check">(
    pending ? "pending" : "plans"
  );
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("yearly");
  const [vipEmail, setVipEmail] = useState("");
  const [vipError, setVipError] = useState(false);
  const [vipSuccess, setVipSuccess] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const handleVipCheck = () => {
    const success = onActivateVip(vipEmail);
    if (success) {
      setVipSuccess(true);
      setVipError(false);
      setTimeout(onClose, 2000);
    } else {
      setVipError(true);
    }
  };

  const handleSubmitPayment = () => {
    if (!fullName || !email || !reference) return;
    onSubmitPayment({
      fullName,
      email,
      plan: selectedPlan,
      amount: selectedPlan === "monthly" ? "$10" : "$100",
      reference,
      proofFileName: proofFile?.name || "Not uploaded",
      submittedAt: new Date().toISOString(),
    });
    setStep("pending");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              {accessStatus === "locked" ? (
                <Lock size={20} className="text-destructive" />
              ) : (
                <Crown size={20} className="text-primary" />
              )}
              <h3 className="font-heading font-bold text-foreground text-lg">
                {accessStatus === "locked" ? "Credits Exhausted" : "Upgrade Access"}
              </h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* ─── VIP Check ─── */}
              {step === "vip-check" && (
                <motion.div key="vip" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  {vipSuccess ? (
                    <div className="text-center py-8">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                        <Sparkles size={48} className="text-primary mx-auto mb-4" />
                      </motion.div>
                      <h4 className="text-2xl font-heading font-bold text-foreground mb-2">VIP Access Granted</h4>
                      <p className="text-muted-foreground">Unlimited access activated. Welcome!</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-muted-foreground text-sm mb-4">Enter your VIP email to verify access.</p>
                      <input
                        type="email"
                        value={vipEmail}
                        onChange={(e) => { setVipEmail(e.target.value); setVipError(false); }}
                        placeholder="Enter VIP email"
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3"
                      />
                      {vipError && (
                        <p className="text-destructive text-xs mb-3 flex items-center gap-1">
                          <AlertTriangle size={12} /> This email does not have VIP access.
                        </p>
                      )}
                      <div className="flex gap-3">
                        <button onClick={() => setStep("plans")} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                          Back
                        </button>
                        <button onClick={handleVipCheck} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                          Verify
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* ─── Plans ─── */}
              {step === "plans" && (
                <motion.div key="plans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  {accessStatus === "locked" && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-5 flex items-start gap-3">
                      <AlertTriangle size={18} className="text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Your free credits are used up</p>
                        <p className="text-xs text-muted-foreground mt-1">Subscribe to continue using the AI Builder.</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          selectedPlan === plan.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-heading font-semibold text-foreground">{plan.label}</p>
                            <p className="text-muted-foreground text-xs mt-0.5">Unlimited AI generations</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-heading font-bold text-foreground">{plan.price}</span>
                            <span className="text-muted-foreground text-xs">{plan.period}</span>
                            {plan.savings && (
                              <p className="text-xs text-primary font-medium mt-0.5">{plan.savings}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setStep("payment")}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard size={16} />
                    Proceed to Payment
                  </button>

                  <button
                    onClick={() => setStep("vip-check")}
                    className="w-full mt-3 py-2.5 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1"
                  >
                    <Crown size={12} /> Have a VIP code? Click here
                  </button>
                </motion.div>
              )}

              {/* ─── Payment Instructions ─── */}
              {step === "payment" && (
                <motion.div key="payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="bg-primary/5 border border-primary/15 rounded-xl p-5 mb-6">
                    <h4 className="font-heading font-semibold text-foreground mb-3">Payment Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plan</span>
                        <span className="font-medium text-foreground">
                          {selectedPlan === "monthly" ? "1 Month All Access" : "1 Year All Access"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-bold text-foreground">
                          {selectedPlan === "monthly" ? "$10" : "$100"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-primary/15">
                      <p className="text-xs text-muted-foreground mb-1">Transfer to:</p>
                      <p className="font-heading font-bold text-foreground text-lg">Moniepoint</p>
                      <p className="font-mono text-xl font-bold text-primary tracking-wider">9047188353</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4">
                    After completing your transfer, fill in the confirmation form below.
                  </p>

                  <div className="flex gap-3">
                    <button onClick={() => setStep("plans")} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                      Back
                    </button>
                    <button onClick={() => setStep("form")} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                      I've Paid — Confirm
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ─── Confirmation Form ─── */}
              {step === "form" && (
                <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <p className="text-sm text-muted-foreground mb-5">Complete the form to confirm your payment.</p>
                  <div className="space-y-3">
                    <input
                      type="text" placeholder="Full Name" required value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    />
                    <input
                      type="email" placeholder="Email Address" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    />
                    <div className="flex gap-3">
                      <div className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground">
                        {selectedPlan === "monthly" ? "1 Month — $10" : "1 Year — $100"}
                      </div>
                    </div>
                    <input
                      type="text" placeholder="Transaction Reference" required value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    />
                    <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-border hover:border-primary/30 transition-colors cursor-pointer">
                      <Upload size={18} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {proofFile ? proofFile.name : "Upload Proof of Payment"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setStep("payment")} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                      Back
                    </button>
                    <button
                      onClick={handleSubmitPayment}
                      disabled={!fullName || !email || !reference}
                      className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={14} />
                      Confirm Payment
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ─── Pending ─── */}
              {step === "pending" && (
                <motion.div key="pending" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center py-6">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Clock size={28} className="text-primary" />
                  </div>
                  <h4 className="text-xl font-heading font-bold text-foreground mb-2">Payment Under Review</h4>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                    Your payment confirmation has been submitted. Access will be granted once verified — usually within a few hours.
                  </p>
                  {pending && (
                    <div className="bg-muted/50 rounded-lg p-4 text-left text-xs space-y-1.5 mb-6">
                      <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="text-foreground font-medium">{pending.fullName}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-foreground font-medium">{pending.email}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="text-foreground font-medium">{pending.amount}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="text-foreground font-medium">{pending.reference}</span></div>
                    </div>
                  )}
                  <button onClick={onClose} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    Close
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaywallModal;
