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
  const [builds, setBuilds] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth?redirect=/dashboard", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setTxs((data || []) as Tx[]));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase.from("build_sessions")
      .select("id, category, prompt, state, created_at")
      .eq("user_id", user.id).neq("state", "completed")
      .order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => setBuilds(data || []));
  }, [user]);

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
            <CardHeader icon={<Coins size={16} />} title="AI Coin Balance" />
            {credits?.lifetime_unlimited ? (
              <div className="flex items-center gap-2 text-blue font-heading font-bold text-2xl">
                <InfinityIcon size={28} /> Unlimited
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-heading font-bold text-3xl text-foreground">{credits?.paid_balance ?? 0}</span>
                  <span className="text-xs text-muted-foreground">coins remaining</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-muted-foreground">Plan allocation</p>
                    <p className="font-semibold text-foreground">{subscription?.coins_granted ?? 0}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-muted-foreground">Coins used</p>
                    <p className="font-semibold text-foreground">{credits?.total_used ?? 0}</p>
                  </div>
                </div>
                {(credits?.paid_balance ?? 0) === 0 && (
                  <Link to="/pricing" className="text-xs text-primary font-medium hover:underline mt-2 inline-block">Subscribe to get coins →</Link>
                )}
              </>
            )}
          </Card>

          {/* Renewal */}
          <Card>
            <CardHeader icon={<Clock size={16} />} title="Billing Period" />
            <div className="font-heading text-lg font-bold text-foreground">
              {subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : "No active plan"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {subscription?.expires_at ? "Your coins refill on this date." : "YAIDEV is paid-only — subscribe to start building."}
            </p>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader icon={<Crown size={16} />} title="Subscription" />
            <div className="flex items-center gap-2">
              {subscription?.plan === "forever" ? <Sparkles size={18} className="text-blue" /> : null}
              <span className="font-heading font-semibold text-lg text-foreground">{planLabel}</span>
            </div>
            {subscription && (
              <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                Billed {(subscription as any).billing_cycle || "monthly"}
              </p>
            )}
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

        {builds.length > 0 && (
          <div className="mb-6">
            <Card>
              <CardHeader icon={<Sparkles size={16} />} title="Saved Builds" />
              <div className="divide-y divide-border">
                {builds.map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground capitalize truncate">{b.category}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{b.prompt}</p>
                    </div>
                    <Link
                      to={`/?builder=1&resume=${b.id}`}
                      className="flex-shrink-0 text-[11px] font-semibold text-primary hover:underline"
                    >
                      Resume build →
                    </Link>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader icon={<Receipt size={16} />} title="Transaction History" />
          {txs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {txs.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2.5 text-sm gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground capitalize truncate">{t.plan || "—"} <span className="text-muted-foreground text-xs">· {t.provider}</span></p>
                    <p className="text-[11px] text-muted-foreground truncate">{new Date(t.created_at).toLocaleString()} {t.reference ? `· ${t.reference}` : ""}</p>
                  </div>
                  <div className="text-right flex items-center gap-3 flex-shrink-0">
                    <div>
                      <p className="font-semibold text-foreground">{t.currency} {(t.amount_cents / 100).toLocaleString()}</p>
                      <p className={`text-[11px] font-medium ${t.status === "success" ? "text-teal" : t.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>
                        {t.status.toUpperCase()} {t.coins_added ? `· +${t.coins_added} coins` : ""}
                      </p>
                    </div>
                    {t.status === "success" && (
                      <button
                        onClick={() => downloadInvoice(t, profile?.full_name || user.email || "", user.email || "")}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Invoice
                      </button>
                    )}
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

function downloadInvoice(t: Tx, name: string, email: string) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>YAIDEV Invoice ${t.reference || t.id}</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;padding:40px;max-width:640px;margin:auto}
h1{margin:0 0 4px;font-size:22px}.brand{color:#2563eb;font-weight:700;letter-spacing:.2em;text-transform:uppercase;font-size:11px}
table{width:100%;border-collapse:collapse;margin-top:24px}td{padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px}
td:first-child{color:#64748b;width:180px;text-transform:uppercase;font-size:11px;letter-spacing:.1em}
.total{font-size:20px;font-weight:700}.foot{margin-top:32px;color:#94a3b8;font-size:11px;text-align:center}
</style></head><body>
<div class="brand">YAIDEV</div><h1>Payment Invoice</h1>
<p style="color:#64748b;font-size:13px;margin:4px 0 0">Reference ${t.reference || t.id}</p>
<table><tbody>
<tr><td>Billed to</td><td>${name}<br><span style="color:#64748b">${email}</span></td></tr>
<tr><td>Date</td><td>${new Date(t.created_at).toLocaleString()}</td></tr>
<tr><td>Plan</td><td style="text-transform:capitalize">${t.plan || "—"}</td></tr>
<tr><td>Payment method</td><td style="text-transform:capitalize">${t.provider}</td></tr>
<tr><td>Status</td><td style="text-transform:uppercase;color:#0d9488;font-weight:600">${t.status}</td></tr>
<tr><td>AI Coins</td><td>+${t.coins_added || 0}</td></tr>
<tr><td>Amount</td><td class="total">${t.currency} ${(t.amount_cents / 100).toLocaleString()}</td></tr>
</tbody></table>
<p class="foot">Thank you for choosing YAIDEV. This is an official receipt for your records.</p>
<script>window.onload=()=>{setTimeout(()=>window.print(),300)}</script>
</body></html>`;
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) return;
  w.document.open(); w.document.write(html); w.document.close();
}

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
