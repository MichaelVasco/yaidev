import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Mail, Sparkles, MessageSquare, CheckCircle2, XCircle, Loader2, Activity,
  Inbox, AlertTriangle, FileText, Reply, Zap
} from "lucide-react";
import ServiceLayout, { Card, SectionTitle, TabBar } from "@/components/ServiceLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/use-credits";
import { toast } from "sonner";
import {
  callAiService, createItem, decideApproval, getProfile, listActivity, listApprovals,
  listItems, logActivity, requestApproval, updateItemStatus, upsertProfile,
  type ServiceItem, type ApprovalRequest, type ServiceProfile
} from "@/lib/service-api";
import { StatusBadge, JsonPreview } from "./SocialMediaManager";

type Tab = "studio" | "drafts" | "approvals" | "activity";

export default function EmailManager() {
  const { user } = useAuth();
  const { canUse, spendCredit } = useCredits();
  const [params, setParams] = useSearchParams();
  const [profile, setProfile] = useState<ServiceProfile | null>(null);
  const [config, setConfig] = useState<any>({ fullName: "", email: "", emailProvider: "Gmail", phone: "", companyName: "", notification: "In-app" });
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "studio");
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [mode, setMode] = useState<"draft" | "summary">("draft");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => { if (user) getProfile(user.id, "email").then(p => { setProfile(p); if (p) setConfig({ ...config, ...p.config }); }); }, [user?.id]);

  const reload = async () => {
    if (!user) return;
    const [it, ap, ac] = await Promise.all([listItems(user.id, "email"), listApprovals(user.id), listActivity(user.id, "email")]);
    setItems(it); setApprovals(ap.filter(a => a.module === "email")); setActivity(ac);
  };
  useEffect(() => { reload(); }, [user?.id]);

  const save = async () => {
    if (!user) return;
    if (!config.fullName || !config.email) { toast.error("Name and email required"); return; }
    const p = await upsertProfile(user.id, "email", config);
    setProfile(p);
    await logActivity(user.id, "email", "profile.saved");
    toast.success("Setup saved");
  };

  const generate = async () => {
    if (!user || !profile || !prompt.trim()) return;
    if (!canUse) { toast.error("Out of credits"); return; }
    setLoading(true); setResult(null);
    try {
      const spend = await spendCredit(); if (!spend.ok) return;
      const r = await callAiService("email", mode === "draft" ? "draft" : "summary", { prompt, profile: profile.config });
      setResult(r);
      const title = (r.subject || r.summary || prompt).toString().slice(0, 80);
      await createItem({ user_id: user.id, profile_id: profile.id, module: "email", type: mode, title, content: r });
      await logActivity(user.id, "email", `generated.${mode}`);
      reload();
      toast.success("Draft created");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  const askApproval = async (i: ServiceItem) => {
    if (!user) return;
    await requestApproval(user.id, "email", i.id, "send");
    await logActivity(user.id, "email", "approval.requested");
    reload(); toast.success("Sent for approval");
  };
  const decide = async (a: ApprovalRequest, decision: "approved" | "rejected") => {
    await decideApproval(a.id, a.item_id, decision);
    if (decision === "approved" && a.item_id) await updateItemStatus(a.item_id, "published");
    if (user) await logActivity(user.id, "email", `approval.${decision}`);
    reload(); toast.success(decision === "approved" ? "Sent (demo)" : "Rejected");
  };

  if (!profile) {
    return (
      <ServiceLayout title="Email Manager" subtitle="Summarize, triage and draft emails with AI." icon={<Mail size={20} />}>
        <Card>
          <SectionTitle>Setup</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              ["fullName", "Full Name *"], ["email", "Email Address *"],
              ["phone", "Phone Number"], ["companyName", "Company Name"],
            ].map(([k, l]) => (
              <div key={k}>
                <label className="text-xs font-medium text-muted-foreground">{l}</label>
                <input value={config[k] || ""} onChange={e => setConfig({ ...config, [k]: e.target.value })}
                  className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email Provider</label>
              <select value={config.emailProvider} onChange={e => setConfig({ ...config, emailProvider: e.target.value })}
                className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
                {["Gmail", "Outlook", "Yahoo", "Apple Mail", "ProtonMail", "Other"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Preferred Notification</label>
              <select value={config.notification} onChange={e => setConfig({ ...config, notification: e.target.value })}
                className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
                {["In-app", "Email", "Both"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <AlertTriangle size={12} className="text-yellow-500" /> We never request or store your email password. Real send/receive uses OAuth — connect in Settings.
          </p>
          <button onClick={save} className="mt-4 bg-blue text-white px-5 py-2 rounded-lg font-medium">Save & continue</button>
        </Card>
      </ServiceLayout>
    );
  }

  const stats = [
    { label: "Total drafts", value: items.length, icon: FileText, color: "text-blue" },
    { label: "Pending approval", value: approvals.filter(a => a.status === "pending").length, icon: CheckCircle2, color: "text-yellow-500" },
    { label: "Sent (demo)", value: items.filter(i => i.status === "published").length, icon: Reply, color: "text-teal" },
    { label: "Urgent", value: items.filter(i => i.content?.priority === "urgent").length, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <ServiceLayout title="Email Manager" subtitle={`Connected as ${profile.config.email}`} icon={<Mail size={20} />}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {stats.map(s => (
          <Card key={s.label} className="!p-4">
            <s.icon size={16} className={s.color} />
            <p className="font-heading font-bold text-2xl text-foreground mt-1">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <TabBar value={tab} onChange={(v) => { setTab(v); setParams({ tab: v }, { replace: true }); }} tabs={[
        { value: "studio", label: "AI Studio", icon: <Sparkles size={14} /> },
        { value: "drafts", label: `Drafts (${items.length})`, icon: <Inbox size={14} /> },
        { value: "approvals", label: `Approvals (${approvals.filter(a => a.status === "pending").length})`, icon: <CheckCircle2 size={14} /> },
        { value: "activity", label: "Activity", icon: <Activity size={14} /> },
      ]} />

      {tab === "studio" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <SectionTitle>AI Studio</SectionTitle>
            <div className="flex gap-2 mb-3">
              {(["draft", "summary"] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${mode === m ? "border-blue bg-blue/10 text-blue" : "border-border text-muted-foreground"}`}>
                  {m === "draft" ? "Draft email" : "Summarize email"}
                </button>
              ))}
            </div>
            <textarea rows={6} value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder={mode === "draft" ? "Describe the email you want to draft…" : "Paste the email you'd like summarized…"}
              className="w-full bg-background border border-border rounded-lg p-3 text-sm outline-none focus:border-blue resize-none" />
            <button onClick={generate} disabled={loading || !prompt.trim()}
              className="mt-3 w-full bg-blue text-white rounded-lg py-2.5 font-medium hover:bg-blue/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Zap size={16} /> Generate (-1 credit)</>}
            </button>
          </Card>
          <Card>
            <SectionTitle>Preview</SectionTitle>
            {!result ? <p className="text-sm text-muted-foreground text-center py-12">Output will appear here.</p>
              : <JsonPreview data={result} />}
          </Card>
        </div>
      )}

      {tab === "drafts" && (
        <div className="space-y-3">
          {items.length === 0 && <Card><p className="text-sm text-muted-foreground text-center py-6">No drafts yet.</p></Card>}
          {items.map(i => (
            <Card key={i.id}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{i.title}</p>
                  <p className="text-[11px] text-muted-foreground">{i.type} · {new Date(i.created_at).toLocaleString()} · <StatusBadge status={i.status} /></p>
                </div>
                {i.type === "draft" && i.status === "draft" && (
                  <button onClick={() => askApproval(i)} className="text-xs bg-blue text-white px-3 py-1.5 rounded-lg shrink-0">Approve & send</button>
                )}
              </div>
              <details><summary className="cursor-pointer text-xs text-blue">View content</summary>
                <div className="mt-2"><JsonPreview data={i.content} /></div>
              </details>
            </Card>
          ))}
        </div>
      )}

      {tab === "approvals" && (
        <div className="space-y-3">
          {approvals.length === 0 && <Card><p className="text-sm text-muted-foreground text-center py-6">No approval requests.</p></Card>}
          {approvals.map(a => {
            const item = items.find(i => i.id === a.item_id);
            return (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div><p className="font-semibold">{item?.title || a.action}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString()} · <StatusBadge status={a.status} /></p>
                  </div>
                  {a.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => decide(a, "approved")} className="text-xs bg-teal text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><CheckCircle2 size={12} /> Approve</button>
                      <button onClick={() => decide(a, "rejected")} className="text-xs bg-destructive text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><XCircle size={12} /> Reject</button>
                    </div>
                  )}
                </div>
                {item && <details><summary className="cursor-pointer text-xs text-blue">View content</summary>
                  <div className="mt-2"><JsonPreview data={item.content} /></div>
                </details>}
              </Card>
            );
          })}
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
