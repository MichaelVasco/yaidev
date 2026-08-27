import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Loader2, XCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RESUME_BUILD_KEY } from "@/components/PaywallModal";

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading, refreshAll } = useAuth();
  const [state, setState] = useState<"verifying" | "success" | "error">("verifying");
  const [result, setResult] = useState<{ plan?: string; coins?: number; renewal?: string; error?: string }>({});
  const [resumeBuild, setResumeBuild] = useState<string | null>(null);

  const reference = params.get("reference") || params.get("trxref");

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate(`/auth?redirect=/payment/success?reference=${reference}`); return; }
    if (!reference) { setState("error"); setResult({ error: "Missing payment reference" }); return; }

    (async () => {
      const { data, error } = await supabase.functions.invoke("paystack-verify", { body: { reference } });
      if (error || !(data as any)?.ok) {
        setState("error");
        setResult({ error: (data as any)?.error || error?.message || "Verification failed" });
        return;
      }
      const act = (data as any).activation || {};
      await refreshAll();
      setState("success");
      setResult({
        plan: act.plan || (data as any).plan,
        coins: act.coins_added ?? (data as any).coins_added,
        renewal: act.expires_at
          ? new Date(act.expires_at).toLocaleDateString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      });

      // Resume the build the user was paying to complete.
      let resume: string | null = null;
      try {
        resume = localStorage.getItem(RESUME_BUILD_KEY);
        if (resume) localStorage.removeItem(RESUME_BUILD_KEY);
      } catch { /* storage unavailable */ }
      setResumeBuild(resume);
      setTimeout(() => navigate(resume ? `/?builder=1&resume=${resume}` : "/dashboard"), resume ? 2500 : 6000);
    })();
  }, [user, loading, reference]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {state === "verifying" && (
          <>
            <Loader2 className="animate-spin text-primary mx-auto mb-4" size={36} />
            <h1 className="font-heading font-bold text-xl text-foreground mb-1">Confirming your payment…</h1>
            <p className="text-sm text-muted-foreground">Hang tight, this only takes a moment.</p>
          </>
        )}

        {state === "success" && (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
              className="w-16 h-16 rounded-full bg-teal/15 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-teal" />
            </motion.div>
            <h1 className="font-heading font-bold text-2xl text-foreground mb-2 flex items-center justify-center gap-2">
              <Sparkles size={20} className="text-primary" /> Welcome to YAIDEV Premium
            </h1>
            <p className="text-sm text-muted-foreground mb-5">{resumeBuild ? "Your subscription is active — your saved build is resuming now." : "Your subscription is now active."}</p>
            <div className="space-y-2 bg-muted/40 rounded-lg p-4 mb-5 text-sm text-left">
              {result.plan && <Row label="Plan" value={result.plan.toUpperCase()} />}
              {result.coins !== undefined && <Row label="Credits added" value={`+${result.coins}`} />}
              {result.renewal && <Row label="Next renewal" value={result.renewal} />}
            </div>
            <Link to="/dashboard" className="inline-block w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
              Go to dashboard
            </Link>
            <p className="text-[11px] text-muted-foreground mt-3">{resumeBuild ? "Resuming your build automatically…" : "Redirecting automatically…"}</p>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle size={36} className="text-destructive mx-auto mb-4" />
            <h1 className="font-heading font-bold text-xl text-foreground mb-1">Payment not confirmed</h1>
            <p className="text-sm text-muted-foreground mb-5">{result.error}</p>
            <Link to="/pricing" className="inline-block w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
              Back to pricing
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
    <span className="text-foreground font-semibold">{value}</span>
  </div>
);

export default PaymentSuccess;
