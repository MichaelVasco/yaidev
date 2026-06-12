import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText, Table2, Presentation, Mail as MailIcon, StickyNote, Database, Users,
  Sparkles, Loader2, Zap, Activity, Plug
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

const TOOLS = [
  { id: "word", name: "Word", icon: FileText, color: "text-blue", action: "word", placeholder: "Write a 1-page company overview…" },
  { id: "excel", name: "Excel", icon: Table2, color: "text-teal", action: "excel", placeholder: "Build a Q1 revenue spreadsheet by region with formulas…" },
  { id: "powerpoint", name: "PowerPoint", icon: Presentation, color: "text-red-500", action: "powerpoint", placeholder: "10-slide investor pitch deck for an AI startup…" },
  { id: "outlook", name: "Outlook", icon: MailIcon, color: "text-blue", action: "outlook", placeholder: "Draft a follow-up email after a client demo…" },
  { id: "onenote", name: "OneNote", icon: StickyNote, color: "text-purple", action: "onenote", placeholder: "Notes from a product strategy meeting…" },
  { id: "access", name: "Access", icon: Database, color: "text-red-500", action: "access", placeholder: "Inventory database for a small e-commerce store…" },
  { id: "teams", name: "Teams", icon: Users, color: "text-purple", action: "teams", placeholder: "Channel message announcing new feature launch…" },
];

type Tab = "tools" | "history" | "activity";

export default function OfficeManager() {
  const { user } = useAuth();
  const { canUse, spendCredit } = useCredits();
  const [params, setParams] = useSearchParams();
  const [profile, setProfile] = useState<ServiceProfile | null>(null);
  const [config, setConfig] = useState<any>({ fullName: "", email: "", organization: "", role: "" });
  const [tool, setTool] = useState<string>(params.get("tool") || "word");
  const [tab, setTab] = useState<Tab>("tools");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => { if (user) getProfile(user.id, "office").then(p => { setProfile(p); if (p) setConfig({ ...config, ...p.config }); }); }, [user?.id]);
  const reload = async () => {
    if (!user) return;
    setItems(await listItems(user.id, "office"));
    setActivity(await listActivity(user.id, "office"));
  };
  useEffect(() => { reload(); }, [user?.id]);

  const save = async () => {
    if (!user) return;
    if (!config.fullName || !config.email) { toast.error("Name and email required"); return; }
    const p = await upsertProfile(user.id, "office", config);
    setProfile(p);
    await logActivity(user.id, "office", "profile.saved");
    toast.success("Setup saved");
  };

  const t = TOOLS.find(x => x.id === tool)!;

  const generate = async () => {
    if (!user || !profile || !prompt.trim()) return;
    if (!canUse) { toast.error("Out of credits"); return; }
    setLoading(true); setResult(null);
    try {
      const spend = await spendCredit(); if (!spend.ok) return;
      const r = await callAiService("office", t.action, { prompt, profile: profile.config });
      setResult(r);
      const title = (r.title || r.databaseName || r.subject || prompt).toString().slice(0, 80);
      await createItem({ user_id: user.id, profile_id: profile.id, module: "office", type: t.id, title, content: r, status: "approved" });
      await logActivity(user.id, "office", `generated.${t.id}`);
      reload();
      toast.success(`${t.name} generated`);
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  if (!profile) {
    return (
      <ServiceLayout title="Microsoft Office Manager" subtitle="AI for Word, Excel, PowerPoint, Outlook, OneNote, Access & Teams." icon={<FileText size={20} />}>
        <Card>
          <SectionTitle>Get started</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            {[["fullName", "Full Name *"], ["email", "Work Email *"], ["organization", "Organization"], ["role", "Your Role"]].map(([k, l]) => (
              <div key={k}>
                <label className="text-xs font-medium text-muted-foreground">{l}</label>
                <input value={config[k] || ""} onChange={e => setConfig({ ...config, [k]: e.target.value })}
                  className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" />
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg border border-border bg-muted/30 flex items-start gap-2">
            <Plug size={14} className="text-blue mt-0.5" />
            <div className="text-xs text-muted-foreground">
              Real document upload, edit and saving to OneDrive requires connecting Microsoft 365. AI generation works immediately; connection unlocks file actions.
            </div>
          </div>
          <button onClick={save} className="mt-4 bg-blue text-white px-5 py-2 rounded-lg font-medium">Save & continue</button>
        </Card>
      </ServiceLayout>
    );
  }

  return (
    <ServiceLayout title="Microsoft Office Manager" subtitle={profile.config.organization || profile.config.email} icon={<FileText size={20} />}>
      <TabBar value={tab} onChange={setTab} tabs={[
        { value: "tools", label: "Tools", icon: <Sparkles size={14} /> },
        { value: "history", label: `History (${items.length})`, icon: <FileText size={14} /> },
        { value: "activity", label: "Activity", icon: <Activity size={14} /> },
      ]} />

      {tab === "tools" && (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-5">
            {TOOLS.map(x => (
              <button key={x.id} onClick={() => { setTool(x.id); setParams({ tool: x.id }, { replace: true }); setResult(null); setPrompt(""); }}
                className={`p-3 rounded-xl border text-center transition ${tool === x.id ? "border-blue bg-blue/10" : "border-border bg-card hover:border-blue/40"}`}>
                <x.icon size={20} className={`${x.color} mx-auto`} />
                <p className="text-[11px] mt-1 font-medium text-foreground">{x.name}</p>
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <SectionTitle>{t.name} AI</SectionTitle>
              <textarea rows={7} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={t.placeholder}
                className="w-full bg-background border border-border rounded-lg p-3 text-sm outline-none focus:border-blue resize-none" />
              <button onClick={generate} disabled={loading || !prompt.trim()}
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
        </>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          {items.length === 0 && <Card><p className="text-sm text-muted-foreground text-center py-6">No documents yet.</p></Card>}
          {items.map(i => (
            <Card key={i.id}>
              <div className="flex items-center justify-between mb-2">
                <div><p className="font-semibold">{i.title}</p>
                  <p className="text-[11px] text-muted-foreground">{i.type} · {new Date(i.created_at).toLocaleString()} · <StatusBadge status={i.status} /></p>
                </div>
              </div>
              <details><summary className="cursor-pointer text-xs text-blue">View</summary>
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
