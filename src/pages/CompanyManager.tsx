import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2, Sparkles, Loader2, Zap, Activity, TrendingUp, AlertTriangle, Target,
  BarChart3, DollarSign, LineChart
} from "lucide-react";
import ServiceLayout, { Card, SectionTitle, TabBar } from "@/components/ServiceLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/use-credits";
import { toast } from "sonner";
import {
  callAiService, createItem, getProfile, listActivity, listItems, logActivity, upsertProfile,
  type ServiceItem, type ServiceProfile
} from "@/lib/service-api";
import { JsonPreview, StatusBadge } from "./SocialMediaManager";

type Tab = "dashboard" | "studio" | "reports" | "activity";

const initial = {
  companyName: "", industry: "", country: "", employees: "", revenue: "",
  revenueGoal: "", profitGoal: "", valuation: "", targetDate: "", challenges: "",
  growthObjectives: "", email: "", phone: "",
};

export default function CompanyManager() {
  const { user } = useAuth();
  const { canUse, spendCredit } = useCredits();
  const [params, setParams] = useSearchParams();
  const [profile, setProfile] = useState<ServiceProfile | null>(null);
  const [config, setConfig] = useState<any>(initial);
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "dashboard");
  const [action, setAction] = useState<"daily" | "growth" | "kpis">("daily");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => { if (user) getProfile(user.id, "company").then(p => { setProfile(p); if (p) setConfig({ ...initial, ...p.config }); }); }, [user?.id]);
  const reload = async () => {
    if (!user) return;
    setItems(await listItems(user.id, "company"));
    setActivity(await listActivity(user.id, "company"));
  };
  useEffect(() => { reload(); }, [user?.id]);

  const save = async () => {
    if (!user) return;
    if (!config.companyName || !config.industry || !config.email) { toast.error("Fill required fields"); return; }
    const p = await upsertProfile(user.id, "company", config);
    setProfile(p);
    await logActivity(user.id, "company", "profile.saved");
    toast.success("Company saved");
  };

  const generate = async (act: typeof action, autoPrompt?: string) => {
    if (!user || !profile) return;
    if (!canUse) { toast.error("Out of credits"); return; }
    setLoading(true); setResult(null); setAction(act);
    try {
      const spend = await spendCredit(); if (!spend.ok) return;
      const r = await callAiService("company", act, {
        prompt: autoPrompt || prompt || `Generate ${act} recommendations for this company.`,
        profile: profile.config,
      });
      setResult(r);
      const title = act === "daily" ? `Daily report ${new Date().toLocaleDateString()}` :
        act === "growth" ? "Growth & profitability forecast" : "KPI recommendations";
      await createItem({ user_id: user.id, profile_id: profile.id, module: "company", type: act, title, content: r, status: "approved" });
      await logActivity(user.id, "company", `generated.${act}`);
      reload();
      toast.success("Report generated");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  if (!profile) {
    return (
      <ServiceLayout title="Company Manager" subtitle="AI strategic advisor for your business." icon={<Building2 size={20} />}>
        <Card>
          <SectionTitle>Tell us about your company</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            {([
              ["companyName", "Company Name *"], ["industry", "Industry *"],
              ["country", "Country"], ["employees", "Number of Employees", "number"],
              ["revenue", "Current Revenue (USD)"], ["revenueGoal", "Revenue Goal"],
              ["profitGoal", "Profit Goal"], ["valuation", "Desired Valuation"],
              ["targetDate", "Target Date", "date"],
              ["email", "Email *", "email"], ["phone", "Phone"],
            ] as [string, string, string?][]).map(([k, l, t]) => (
              <div key={k}>
                <label className="text-xs font-medium text-muted-foreground">{l}</label>
                <input type={t || "text"} value={config[k] || ""} onChange={e => setConfig({ ...config, [k]: e.target.value })}
                  className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Business Challenges</label>
              <textarea rows={2} value={config.challenges} onChange={e => setConfig({ ...config, challenges: e.target.value })}
                className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Growth Objectives</label>
              <textarea rows={2} value={config.growthObjectives} onChange={e => setConfig({ ...config, growthObjectives: e.target.value })}
                className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue resize-none" />
            </div>
          </div>
          <button onClick={save} className="mt-4 bg-blue text-white px-5 py-2 rounded-lg font-medium">Save & build dashboard</button>
        </Card>
      </ServiceLayout>
    );
  }

  const latestGrowth = items.find(i => i.type === "growth")?.content;
  const latestDaily = items.find(i => i.type === "daily")?.content;
  const growthScore = latestGrowth?.growthScore ?? 0;

  return (
    <ServiceLayout title={profile.config.companyName} subtitle={`${profile.config.industry || ""} · ${profile.config.country || ""}`} icon={<Building2 size={20} />}>
      <TabBar value={tab} onChange={(v) => { setTab(v); setParams({ tab: v }, { replace: true }); }} tabs={[
        { value: "dashboard", label: "Dashboard", icon: <BarChart3 size={14} /> },
        { value: "studio", label: "AI Studio", icon: <Sparkles size={14} /> },
        { value: "reports", label: `Reports (${items.length})`, icon: <LineChart size={14} /> },
        { value: "activity", label: "Activity", icon: <Activity size={14} /> },
      ]} />

      {tab === "dashboard" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <Card className="!p-4">
              <Target size={16} className="text-blue" />
              <p className="font-heading font-bold text-2xl mt-1">{growthScore || "—"}</p>
              <p className="text-[11px] text-muted-foreground">Growth Score</p>
            </Card>
            <Card className="!p-4">
              <DollarSign size={16} className="text-teal" />
              <p className="font-heading font-bold text-lg mt-1 truncate">{profile.config.revenue || "—"}</p>
              <p className="text-[11px] text-muted-foreground">Current Revenue</p>
            </Card>
            <Card className="!p-4">
              <TrendingUp size={16} className="text-purple" />
              <p className="font-heading font-bold text-lg mt-1 truncate">{profile.config.revenueGoal || "—"}</p>
              <p className="text-[11px] text-muted-foreground">Revenue Goal</p>
            </Card>
            <Card className="!p-4">
              <AlertTriangle size={16} className="text-yellow-500" />
              <p className="font-heading font-bold text-2xl mt-1">{latestGrowth?.riskAssessment?.length || 0}</p>
              <p className="text-[11px] text-muted-foreground">Risks Tracked</p>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <SectionTitle>Latest daily recommendation</SectionTitle>
              {!latestDaily ? (
                <button onClick={() => generate("daily")} disabled={loading}
                  className="w-full bg-blue text-white rounded-lg py-2.5 font-medium hover:bg-blue/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Zap size={14} /> Generate today's report</>}
                </button>
              ) : (
                <>
                  <p className="text-sm text-foreground mb-2">{latestDaily.executiveSummary}</p>
                  <details><summary className="cursor-pointer text-xs text-blue">Full report</summary>
                    <div className="mt-2"><JsonPreview data={latestDaily} /></div>
                  </details>
                  <button onClick={() => generate("daily")} disabled={loading}
                    className="mt-3 text-xs bg-blue text-white px-3 py-1.5 rounded-lg">Refresh</button>
                </>
              )}
            </Card>
            <Card>
              <SectionTitle>Growth forecast</SectionTitle>
              {!latestGrowth ? (
                <button onClick={() => generate("growth")} disabled={loading}
                  className="w-full bg-blue text-white rounded-lg py-2.5 font-medium hover:bg-blue/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Zap size={14} /> Generate forecast</>}
                </button>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Growth score: <span className="font-bold text-blue text-base">{latestGrowth.growthScore}/100</span></p>
                  <p className="text-sm text-foreground mt-2">{latestGrowth.profitabilityForecast}</p>
                  <details><summary className="cursor-pointer text-xs text-blue mt-2">Full forecast</summary>
                    <div className="mt-2"><JsonPreview data={latestGrowth} /></div>
                  </details>
                </>
              )}
            </Card>
          </div>
        </>
      )}

      {tab === "studio" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <SectionTitle>Strategic AI</SectionTitle>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(["daily", "growth", "kpis"] as const).map(a => (
                <button key={a} onClick={() => setAction(a)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border ${action === a ? "border-blue bg-blue/10 text-blue" : "border-border text-muted-foreground"}`}>
                  {a === "daily" ? "Daily plan" : a === "growth" ? "Growth forecast" : "KPI design"}
                </button>
              ))}
            </div>
            <textarea rows={5} value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder="Optional extra context for the AI…"
              className="w-full bg-background border border-border rounded-lg p-3 text-sm outline-none focus:border-blue resize-none" />
            <button onClick={() => generate(action)} disabled={loading}
              className="mt-3 w-full bg-blue text-white rounded-lg py-2.5 font-medium hover:bg-blue/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Zap size={16} /> Generate (-1 credit)</>}
            </button>
          </Card>
          <Card>
            <SectionTitle>Output</SectionTitle>
            {!result ? <p className="text-sm text-muted-foreground text-center py-12">Output will appear here.</p>
              : <JsonPreview data={result} />}
          </Card>
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-3">
          {items.length === 0 && <Card><p className="text-sm text-muted-foreground text-center py-6">No reports yet.</p></Card>}
          {items.map(i => (
            <Card key={i.id}>
              <div className="flex items-center justify-between mb-2">
                <div><p className="font-semibold">{i.title}</p>
                  <p className="text-[11px] text-muted-foreground">{i.type} · {new Date(i.created_at).toLocaleString()} · <StatusBadge status={i.status} /></p>
                </div>
              </div>
              <details><summary className="cursor-pointer text-xs text-blue">View report</summary>
                <div className="mt-2"><JsonPreview data={i.content} /></div>
              </details>
            </Card>
          ))}
        </div>
      )}

      {tab === "activity" && (
        <Card>
          <SectionTitle>Activity</SectionTitle>
          {activity.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No activity.</p>}
          {activity.map(a => (
            <div key={a.id} className="text-sm border-b border-border py-2 last:border-0 font-mono text-xs">
              {a.action} <span className="text-muted-foreground">· {new Date(a.created_at).toLocaleString()}</span>
            </div>
          ))}
        </Card>
      )}
    </ServiceLayout>
  );
}
