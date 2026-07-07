import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Users, DollarSign, CreditCard, Plus, Minus, Edit2, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AiGatewayAdmin from "@/components/AiGatewayAdmin";

interface Plan {
  id: string; slug: string; name: string; price_cents: number; currency: string;
  monthly_credits: number; features: string[]; sort_order: number; is_active: boolean;
}
interface Tx { id: string; user_id: string; plan: string | null; amount_cents: number; currency: string; status: string; reference: string | null; created_at: string; }
interface Sub { user_id: string; plan: string; status: string; expires_at: string | null; }

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Plan>>({});
  const [adjust, setAdjust] = useState<{ user_id: string; delta: string; reason: string }>({ user_id: "", delta: "", reason: "" });

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth?redirect=/admin"); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      supabase.from("subscription_plans").select("*").order("sort_order"),
      supabase.from("subscriptions").select("user_id,plan,status,expires_at").eq("status", "active").order("started_at", { ascending: false }).limit(50),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(50),
    ]).then(([p, s, t]) => {
      setPlans((p.data || []) as Plan[]);
      setSubs((s.data || []) as Sub[]);
      setTxs((t.data || []) as Tx[]);
    });
  }, [isAdmin]);

  const startEdit = (p: Plan) => { setEditing(p.id); setForm(p); };
  const cancelEdit = () => { setEditing(null); setForm({}); };
  const savePlan = async () => {
    if (!editing) return;
    const { error } = await supabase.from("subscription_plans").update({
      name: form.name, price_cents: form.price_cents, monthly_credits: form.monthly_credits,
      features: form.features, is_active: form.is_active,
    }).eq("id", editing);
    if (error) { toast.error(error.message); return; }
    toast.success("Plan updated");
    const { data } = await supabase.from("subscription_plans").select("*").order("sort_order");
    setPlans((data || []) as Plan[]); cancelEdit();
  };

  const adjustCredits = async () => {
    const delta = parseInt(adjust.delta, 10);
    if (!adjust.user_id || isNaN(delta)) { toast.error("Provide user id and delta"); return; }
    const { data, error } = await supabase.rpc("admin_adjust_credits", {
      _target_user: adjust.user_id, _delta: delta, _reason: adjust.reason || "manual",
    });
    if (error || !(data as any)?.ok) { toast.error(error?.message || "Failed"); return; }
    toast.success(`Adjusted by ${delta} credits`);
    setAdjust({ user_id: "", delta: "", reason: "" });
  };

  const revenue = txs.filter(t => t.status === "success").reduce((sum, t) => sum + t.amount_cents, 0) / 100;

  if (loading || isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6">
        <h1 className="font-heading font-bold text-2xl">Admin only</h1>
        <p className="text-muted-foreground text-sm">You don't have access to this page.</p>
        <Link to="/" className="text-primary text-sm hover:underline">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Back
          </Link>
          <span className="text-xs font-semibold text-primary tracking-wider uppercase">Admin Panel</span>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl space-y-8">
        <h1 className="font-heading font-bold text-3xl text-foreground">Subscription Manager</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat icon={<DollarSign size={16} />} label="Total Revenue" value={`$${revenue.toFixed(2)}`} />
          <Stat icon={<Users size={16} />} label="Active Subscribers" value={String(subs.length)} />
          <Stat icon={<CreditCard size={16} />} label="Transactions" value={String(txs.length)} />
        </div>

        <Section title="Plans">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {plans.map(p => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4">
                {editing === p.id ? (
                  <div className="space-y-2">
                    <Input label="Name" value={form.name || ""} onChange={v => setForm({ ...form, name: v })} />
                    <Input label="Price (cents)" type="number" value={String(form.price_cents || 0)} onChange={v => setForm({ ...form, price_cents: parseInt(v, 10) || 0 })} />
                    <Input label="Monthly credits" type="number" value={String(form.monthly_credits || 0)} onChange={v => setForm({ ...form, monthly_credits: parseInt(v, 10) || 0 })} />
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                      Active
                    </label>
                    <div className="flex gap-2">
                      <button onClick={savePlan} className="flex-1 py-1.5 rounded bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1"><Save size={12}/>Save</button>
                      <button onClick={cancelEdit} className="flex-1 py-1.5 rounded bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1"><X size={12}/>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-heading font-bold text-foreground">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{p.slug}</p>
                      </div>
                      <button onClick={() => startEdit(p)} className="text-muted-foreground hover:text-foreground"><Edit2 size={14} /></button>
                    </div>
                    <p className="font-heading font-bold text-2xl text-foreground">${(p.price_cents / 100).toFixed(0)}<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
                    <p className="text-sm text-primary font-semibold mb-2">{p.monthly_credits} credits</p>
                    <p className="text-[11px] text-muted-foreground">{p.is_active ? "Active" : "Disabled"}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Adjust Credits">
          <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input label="User ID" value={adjust.user_id} onChange={v => setAdjust({ ...adjust, user_id: v })} />
            <Input label="Delta (+/-)" type="number" value={adjust.delta} onChange={v => setAdjust({ ...adjust, delta: v })} />
            <Input label="Reason" value={adjust.reason} onChange={v => setAdjust({ ...adjust, reason: v })} />
            <div className="flex gap-2 items-end">
              <button onClick={() => { setAdjust(a => ({ ...a, delta: String(Math.abs(parseInt(a.delta || "0", 10))) })); adjustCredits(); }}
                className="flex-1 py-2 rounded bg-teal/90 text-white text-xs font-semibold flex items-center justify-center gap-1"><Plus size={12}/>Grant</button>
              <button onClick={() => { setAdjust(a => ({ ...a, delta: `-${Math.abs(parseInt(a.delta || "0", 10))}` })); adjustCredits(); }}
                className="flex-1 py-2 rounded bg-destructive/90 text-white text-xs font-semibold flex items-center justify-center gap-1"><Minus size={12}/>Deduct</button>
            </div>
          </div>
        </Section>

        <Section title="Recent Transactions">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left p-3">When</th><th className="text-left p-3">Plan</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th><th className="text-left p-3">Ref</th></tr>
              </thead>
              <tbody>
                {txs.map(t => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="p-3 text-[11px] text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                    <td className="p-3 font-medium capitalize">{t.plan || "—"}</td>
                    <td className="p-3">{t.currency} {(t.amount_cents / 100).toFixed(2)}</td>
                    <td className={`p-3 font-semibold ${t.status === "success" ? "text-teal" : t.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>{t.status}</td>
                    <td className="p-3 text-[11px] text-muted-foreground truncate max-w-[200px]">{t.reference}</td>
                  </tr>
                ))}
                {txs.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No transactions yet</td></tr>}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h2 className="font-heading font-bold text-lg text-foreground mb-3">{title}</h2>
    {children}
  </div>
);
const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-card border border-border rounded-xl p-4">
    <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-1">{icon}{label}</div>
    <p className="font-heading font-bold text-2xl text-foreground">{value}</p>
  </div>
);
const Input = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <label className="block text-xs">
    <span className="text-muted-foreground uppercase tracking-wider">{label}</span>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      className="mt-1 w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
  </label>
);

export default Admin;
