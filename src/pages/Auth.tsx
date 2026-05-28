import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Loader2, CheckCircle2, ArrowLeft, Sparkles, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";

type Mode = "signin" | "signup" | "forgot";

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

const emailOnly = z.object({ email: z.string().trim().email("Invalid email") });

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path fill="#EA4335" d="M12 5.04c1.7 0 3.23.59 4.43 1.74l3.3-3.3C17.74 1.7 15.1.75 12 .75 7.4.75 3.45 3.4 1.5 7.3l3.85 2.98C6.27 7.39 8.9 5.04 12 5.04z"/>
    <path fill="#4285F4" d="M23.49 12.27c0-.86-.08-1.69-.22-2.49H12v4.71h6.45c-.28 1.49-1.12 2.75-2.39 3.6l3.7 2.86c2.17-2 3.43-4.96 3.43-8.68z"/>
    <path fill="#FBBC05" d="M5.34 14.28a7.2 7.2 0 010-4.56L1.5 6.74A12 12 0 00.75 12c0 1.94.46 3.77 1.5 5.26l3.84-2.98z"/>
    <path fill="#34A853" d="M12 23.25c3.1 0 5.7-1.02 7.6-2.78l-3.7-2.86c-1.03.69-2.36 1.1-3.9 1.1-3.1 0-5.73-2.35-6.65-5.43L1.5 16.26C3.45 20.16 7.4 23.25 12 23.25z"/>
  </svg>
);

const AuthPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { session } = useAuth();
  const [mode, setMode] = useState<Mode>((params.get("mode") as Mode) || "signin");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const redirectTo = params.get("redirect") || "/";

  useEffect(() => {
    if (session) navigate(redirectTo, { replace: true });
  }, [session, redirectTo, navigate]);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + redirectTo });
      if (result.error) { toast.error("Google sign-in failed. Please try again."); setGoogleLoading(false); return; }
      // If redirected, browser navigates away.
    } catch (e) {
      toast.error("Google sign-in failed.");
      setGoogleLoading(false);
    }
  };

  const handleSignUp = async () => {
    const parsed = signUpSchema.safeParse({ fullName, email, password, confirm });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.errors.map(e => [e.path[0] as string, e.message])));
      return;
    }
    setErrors({}); setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth?verified=1`,
        data: { full_name: parsed.data.fullName },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setVerifyNotice(parsed.data.email);
  };

  const handleSignIn = async () => {
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.errors.map(e => [e.path[0] as string, e.message])));
      return;
    }
    setErrors({}); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error("Please verify your email before signing in.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Signed in");
    navigate(redirectTo, { replace: true });
  };

  const handleForgot = async () => {
    const parsed = emailOnly.safeParse({ email });
    if (!parsed.success) { setErrors({ email: parsed.error.errors[0].message }); return; }
    setErrors({}); setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setResetSent(true);
  };

  const verified = params.get("verified") === "1";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue/5 via-background to-purple/5 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-blue/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-purple/10 blur-3xl pointer-events-none" />

      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to YAIDEV
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-xl shadow-blue/5 p-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-primary" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">YAIDEV</span>
        </div>
        <h1 className="font-heading font-bold text-2xl text-foreground mb-1">
          {mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset password" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "signup" ? "Start building with 10 free coins every day."
            : mode === "forgot" ? "Enter your email to get a reset link."
            : "Sign in to continue building."}
        </p>

        {verified && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-teal/10 border border-teal/20 text-sm text-teal-foreground">
            <CheckCircle2 size={16} className="text-teal" />
            <span className="text-teal font-medium">Email verified successfully — you can sign in now.</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {verifyNotice ? (
            <motion.div key="verify-notice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-blue/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="text-blue" size={28} />
                </div>
                <h2 className="font-heading font-semibold text-foreground mb-2">Check your inbox</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  We sent a verification link to <span className="font-medium text-foreground">{verifyNotice}</span>.
                  Click it to activate your account, then return here to sign in.
                </p>
                <button
                  onClick={() => { setVerifyNotice(null); setMode("signin"); }}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            </motion.div>
          ) : resetSent ? (
            <motion.div key="reset-sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center py-6">
                <CheckCircle2 className="text-teal mx-auto mb-3" size={36} />
                <h2 className="font-heading font-semibold text-foreground mb-2">Reset link sent</h2>
                <p className="text-sm text-muted-foreground mb-6">Check your email for password reset instructions.</p>
                <button onClick={() => { setResetSent(false); setMode("signin"); }} className="text-sm text-primary font-medium hover:underline">Back to sign in</button>
              </div>
            </motion.div>
          ) : (
            <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {mode !== "forgot" && (
                <>
                  <button
                    onClick={handleGoogle}
                    disabled={googleLoading || loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium text-foreground disabled:opacity-50"
                  >
                    {googleLoading ? <Loader2 className="animate-spin" size={16} /> : <GoogleIcon />}
                    Continue with Google
                  </button>
                  <div className="flex items-center gap-3 my-5">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider">or</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}

              <div className="space-y-3">
                {mode === "signup" && (
                  <Field icon={<User size={16} />} placeholder="Full name" value={fullName} onChange={setFullName} error={errors.fullName} />
                )}
                <Field icon={<Mail size={16} />} placeholder="Email address" type="email" value={email} onChange={setEmail} error={errors.email} />
                {mode !== "forgot" && (
                  <Field icon={<Lock size={16} />} placeholder="Password" type="password" value={password} onChange={setPassword} error={errors.password} />
                )}
                {mode === "signup" && (
                  <Field icon={<Lock size={16} />} placeholder="Confirm password" type="password" value={confirm} onChange={setConfirm} error={errors.confirm} />
                )}

                {mode === "signin" && (
                  <div className="text-right">
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-primary">Forgot password?</button>
                  </div>
                )}

                <button
                  onClick={mode === "signup" ? handleSignUp : mode === "signin" ? handleSignIn : handleForgot}
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  {mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : "Send reset link"}
                </button>
              </div>

              <div className="mt-5 text-center text-xs text-muted-foreground">
                {mode === "signup" ? (
                  <>Already have an account?{" "}
                    <button onClick={() => setMode("signin")} className="text-primary font-medium hover:underline">Sign in</button>
                  </>
                ) : mode === "signin" ? (
                  <>New here?{" "}
                    <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">Create an account</button>
                  </>
                ) : (
                  <button onClick={() => setMode("signin")} className="text-primary font-medium hover:underline">Back to sign in</button>
                )}
              </div>

              {mode === "signup" && (
                <p className="mt-4 text-[11px] text-muted-foreground/80 text-center flex items-center justify-center gap-1">
                  <Shield size={11} /> We'll send a verification email to confirm it's you.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const Field = ({ icon, placeholder, type = "text", value, onChange, error }: {
  icon: React.ReactNode; placeholder: string; type?: string; value: string; onChange: (v: string) => void; error?: string;
}) => (
  <div>
    <div className={`flex items-center gap-2 px-3 rounded-lg border bg-background focus-within:ring-2 focus-within:ring-primary/30 transition ${error ? "border-destructive/60" : "border-border"}`}>
      <span className="text-muted-foreground">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
      />
    </div>
    {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
  </div>
);

export default AuthPage;
