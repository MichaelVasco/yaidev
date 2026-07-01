import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Coins, Crown, Sparkles, LogOut, Clock, Receipt, User as UserIcon, Infinity as InfinityIcon, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Tx {
  id: string;
  plan: string | null;
  provider: string;
  amount_cents: number;
  currency: string;
  status: string;
  reference: string | null;
  coins_added: number;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, credits, subscription, loading, signOut } = useAuth();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/auth?redirect=/dashboard", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setTxs((data || []) as Tx[]));
  }, [user]);

  useEffect(() => {
    if (!credits) return;
    const update = () => {
      const reset = new Date(new Date(credits.daily_reset_at).getTime() + 24 * 60 * 60 * 1000);
      const diff = reset.getTime() - Date.now();
      if (diff <= 0) { setCountdown("Resetting…"); return; }
      const h = Math.floor(diff / 3.6e6);
      const m = Math.floor((diff % 3.6e6) / 6e4);
      const s = Math.floor((diff % 6e4) / 1000);
      setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [credits]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/", { replace: true });
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const PLAN_LABELS: Record<string, string> = {
    forever: "Forever (Unlimited)",
    business: "YAIDEV Business 400",
    professional: "YAIDEV Professional 200",
    starter: "YAIDEV Starter 100",
    premium: "YAIDEV Premium 800",
    enterprise: "YAIDEV Enterprise",
    enterprise_1200: "YAIDEV Enterprise 1200",
    enterprise_2000: "YAIDEV Enterprise 2000",
    pro: "Pro",
  };
  const planLabel = subscription?.plan ? (PLAN_LABELS[subscription.plan] || subscription.plan) : "Free";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Back to YAIDEV
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading font-bold text-3xl text-foreground mb-1">
            Hello{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">Manage your account, coins, and subscription.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Profile */}
          <Card>
            <CardHeader icon={<UserIcon size={16} />} title="Profile" />
            <div className="space-y-1.5 text-sm">
              <Row label="Name" value={profile?.full_name || "—"} />
              <Row label="Email" value={user.email || "—"} icon={<Mail size={12} />} />
            </div>
          </Card>

          {/* Coins */}
          <Card>
            <CardHeader icon={<Coins size={16} />} title="Coin Balance" />
            {credits?.lifetime_unlimited ? (
              <div className="flex items-center gap-2 text-blue font-heading font-bold text-2xl">
                <InfinityIcon size={28} /> Unlimited
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-heading font-bold text-3xl text-foreground">{(credits?.daily_free_remaining ?? 0) + (credits?.paid_balance ?? 0)}</span>
                  <span className="text-xs text-muted-foreground">coins available</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-muted-foreground">Daily free</p>
                    <p className="font-semibold text-foreground">{credits?.daily_free_remaining ?? 0} / 10</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-muted-foreground">Paid</p>
                    <p className="font-semibold text-foreground">{credits?.paid_balance ?? 0}</p>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Reset countdown */}
          <Card>
            <CardHeader icon={<Clock size={16} />} title="Daily Reset" />
            <div className="font-mono text-2xl font-bold text-foreground tracking-wider">{countdown || "—"}</div>
            <p className="text-xs text-muted-foreground mt-1">Free coins refresh in this much time.</p>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader icon={<Crown size={16} />} title="Subscription" />
            <div className="flex items-center gap-2">
              {subscription?.plan === "forever" ? <Sparkles size={18} className="text-blue" /> : null}
              <span className="font-heading font-semibold text-lg text-foreground">{planLabel}</span>
            </div>
            {subscription?.expires_at && (
              <p className="text-xs text-muted-foreground mt-1">Renews / expires {new Date(subscription.expires_at).toLocaleDateString()}</p>
            )}
            {!subscription && (
              <Link to="/pricing" className="text-xs text-primary font-medium hover:underline mt-2 inline-block">Upgrade plan →</Link>
            )}
            {subscription && (
              <Link to="/pricing" className="text-xs text-primary font-medium hover:underline mt-2 inline-block">Change plan →</Link>
            )}
          </Card>

          {/* Usage */}
          <Card>
            <CardHeader icon={<Sparkles size={16} />} title="Total Usage" />
            <p className="font-heading font-bold text-3xl text-foreground">{credits?.total_used ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">AI generations to date.</p>
          </Card>
        </div>

        <Card>
          <CardHeader icon={<Receipt size={16} />} title="Transaction History" />
          {txs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {txs.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-foreground capitalize">{t.plan || "—"} <span className="text-muted-foreground text-xs">· {t.provider}</span></p>
                    <p className="text-[11px] text-muted-foreground">{new Date(t.created_at).toLocaleString()} {t.reference ? `· ${t.reference}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{t.currency} {(t.amount_cents / 100).toFixed(2)}</p>
                    <p className={`text-[11px] font-medium ${t.status === "success" ? "text-teal" : t.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>
                      {t.status.toUpperCase()} {t.coins_added ? `· +${t.coins_added} coins` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-xl p-5 shadow-sm">{children}</div>
);
const CardHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-2 mb-3 text-muted-foreground">
    {icon} <span className="text-xs uppercase tracking-wider font-semibold">{title}</span>
  </div>
);
const Row = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className="text-foreground font-medium flex items-center gap-1">{icon}{value}</span>
  </div>
);

export default Dashboard;
