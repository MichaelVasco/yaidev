import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Supabase parses the recovery hash automatically into a session
    supabase.auth.getSession().then(({ data }) => setValidSession(!!data.session));
  }, []);

  const handleSubmit = async () => {
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.errors.map(e => [e.path[0] as string, e.message])));
      return;
    }
    setErrors({}); setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    setTimeout(() => navigate("/auth?mode=signin", { replace: true }), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue/5 via-background to-purple/5 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8">
        <h1 className="font-heading font-bold text-2xl text-foreground mb-1">Set a new password</h1>
        <p className="text-sm text-muted-foreground mb-6">Choose a strong password for your account.</p>

        {validSession === false && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
            This reset link is invalid or expired. Please request a new one.
          </div>
        )}

        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="text-teal mx-auto mb-3" size={36} />
            <p className="font-medium text-foreground">Password updated</p>
            <p className="text-sm text-muted-foreground mt-1">Redirecting to sign in…</p>
          </div>
        ) : (
          <div className="space-y-3">
            <PwField value={password} onChange={setPassword} placeholder="New password" error={errors.password} />
            <PwField value={confirm} onChange={setConfirm} placeholder="Confirm new password" error={errors.confirm} />
            <button
              onClick={handleSubmit}
              disabled={loading || validSession === false}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              Update password
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const PwField = ({ value, onChange, placeholder, error }: { value: string; onChange: (v: string) => void; placeholder: string; error?: string }) => (
  <div>
    <div className={`flex items-center gap-2 px-3 rounded-lg border bg-background focus-within:ring-2 focus-within:ring-primary/30 ${error ? "border-destructive/60" : "border-border"}`}>
      <Lock size={16} className="text-muted-foreground" />
      <input
        type="password" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="flex-1 bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
      />
    </div>
    {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
  </div>
);

export default ResetPassword;
