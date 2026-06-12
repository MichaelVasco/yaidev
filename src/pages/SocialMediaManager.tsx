import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Share2, Instagram, Facebook, Youtube, Twitter, Linkedin, Send,
  MessageCircle, Camera, Hash, MessageSquare, AlertCircle, CheckCircle2, XCircle,
  Loader2, Sparkles, Megaphone, TrendingUp, Reply, Calendar, Activity, Zap, MoreHorizontal
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

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue" },
  { id: "tiktok", name: "TikTok", icon: MessageCircle, color: "text-foreground" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-500" },
  { id: "whatsapp", name: "WhatsApp Business", icon: MessageCircle, color: "text-teal" },
  { id: "twitter", name: "X (Twitter)", icon: Twitter, color: "text-foreground" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue" },
  { id: "pinterest", name: "Pinterest", icon: Camera, color: "text-red-500" },
  { id: "snapchat", name: "Snapchat", icon: Camera, color: "text-yellow-500" },
  { id: "threads", name: "Threads", icon: Hash, color: "text-foreground" },
  { id: "telegram", name: "Telegram", icon: Send, color: "text-cyan" },
  { id: "other", name: "Other platforms", icon: MoreHorizontal, color: "text-muted-foreground" },
];

type Tab = "generate" | "drafts" | "approvals" | "activity" | "calendar";

const emptyConfig = {
  fullName: "", companyName: "", email: "", phone: "", handle: "", username: "",
  businessType: "", industry: "", audience: "", postingFrequency: "Daily",
  contentTypes: "", brandVoice: "Professional", postingTimes: "9am, 1pm, 6pm",
  approvalRequired: true,
};

export default function SocialMediaManager() {
  const { user } = useAuth();
  const { canUse, spendCredit } = useCredits();
  const [params, setParams] = useSearchParams();
  const [platform, setPlatform] = useState<string | null>(params.get("platform"));
  const [profile, setProfile] = useState<ServiceProfile | null>(null);
  const [config, setConfig] = useState({ ...emptyConfig });
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "generate");
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // Generate state
  const [action, setAction] = useState<"post" | "campaign" | "reply" | "growth">("post");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!user || !platform) return;
    (async () => {
      const p = await getProfile(user.id, "social", platform);
      setProfile(p);
      if (p?.config) setConfig({ ...emptyConfig, ...p.config });
    })();
  }, [user?.id, platform]);

  const reloadLists = async () => {
    if (!user) return;
    const [it, ap, ac] = await Promise.all([
      listItems(user.id, "social"), listApprovals(user.id), listActivity(user.id, "social"),
    ]);
    setItems(it); setApprovals(ap.filter(a => a.module === "social")); setActivity(ac);
  };
  useEffect(() => { reloadLists(); }, [user?.id, platform]);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i => i.title.toLowerCase().includes(q) || JSON.stringify(i.content).toLowerCase().includes(q));
  }, [items, search]);

  const saveSetup = async () => {
    if (!user || !platform) return;
    if (!config.fullName || !config.companyName || !config.email) {
      toast.error("Please fill required fields"); return;
    }
    const p = await upsertProfile(user.id, "social", config, platform);
    setProfile(p);
    await logActivity(user.id, "social", "profile.saved", { platform });
    toast.success("Setup saved");
  };

  const handleGenerate = async () => {
    if (!user || !platform || !profile) return;
    if (!prompt.trim()) { toast.error("Enter a prompt"); return; }
    if (!canUse) { toast.error("Out of credits — upgrade your plan."); return; }
    setLoading(true); setResult(null);
    try {
      const spend = await spendCredit();
      if (!spend.ok) { toast.error("Could not spend credit"); return; }
      const r = await callAiService("social", action, { prompt, profile: { ...profile.config, platform } });
      setResult(r);
      const title = (r.title || r.name || r.subject || prompt).toString().slice(0, 80);
      const item = await createItem({
        user_id: user.id, profile_id: profile.id, module: "social",
        type: action, title, content: r, status: "draft",
        metadata: { platform, prompt },
      });
      await logActivity(user.id, "social", `generated.${action}`, { itemId: item.id, platform });
      reloadLists();
      toast.success("Draft created");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const sendForApproval = async (item: ServiceItem) => {
    if (!user) return;
    await requestApproval(user.id, "social", item.id, "publish");
    await logActivity(user.id, "social", "approval.requested", { itemId: item.id });
    reloadLists(); toast.success("Sent for approval");
  };

  const decide = async (a: ApprovalRequest, decision: "approved" | "rejected") => {
    await decideApproval(a.id, a.item_id, decision);
    if (decision === "approved" && a.item_id) await updateItemStatus(a.item_id, "published");
    if (user) await logActivity(user.id, "social", `approval.${decision}`, { approvalId: a.id });
    reloadLists();
    toast.success(decision === "approved" ? "Approved & published (demo)" : "Rejected");
  };

  // ---- Render: platform picker → setup form → dashboard ----

  if (!platform) {
    return (
      <ServiceLayout title="Social Media Manager" subtitle="AI-powered content, campaigns and engagement across every channel."
        icon={<Share2 size={20} />}>
        <SectionTitle>Select a platform to manage</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {PLATFORMS.map(p => (
            <motion.button key={p.id} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setPlatform(p.id); setParams({ platform: p.id }, { replace: true }); }}
              className="bg-card border border-border rounded-xl p-5 hover:border-blue/40 transition text-left">
              <p.icon size={22} className={p.color} />
              <p className="mt-2 text-sm font-medium text-foreground">{p.name}</p>
            </motion.button>
          ))}
        </div>
      </ServiceLayout>
    );
  }

  if (!profile) {
    return (
      <ServiceLayout title={`Setup — ${PLATFORMS.find(p => p.id === platform)?.name}`} icon={<Share2 size={20} />}
        subtitle="Tell us about your brand. This powers everything the AI generates.">
        <Card>
          <SetupForm config={config} setConfig={setConfig} />
          <div className="flex gap-2 mt-5">
            <button onClick={saveSetup} className="bg-blue text-white rounded-lg px-5 py-2 font-medium hover:bg-blue/90">
              Save & continue
            </button>
            <button onClick={() => { setPlatform(null); setParams({}); }} className="text-sm text-muted-foreground hover:text-foreground px-3">
              Cancel
            </button>
          </div>
        </Card>
      </ServiceLayout>
    );
  }

  const platformMeta = PLATFORMS.find(p => p.id === platform)!;

  return (
    <ServiceLayout
      title={`${platformMeta.name} Manager`}
      subtitle={`Managing @${profile.config.handle || profile.config.username || profile.config.companyName}`}
      icon={<platformMeta.icon size={20} />}
      onSearch={setSearch}
      searchPlaceholder="Search drafts…"
    >
      <TabBar value={tab} onChange={(v) => { setTab(v); setParams({ platform, tab: v }, { replace: true }); }} tabs={[
        { value: "generate", label: "AI Studio", icon: <Sparkles size={14} /> },
        { value: "drafts", label: `Drafts (${items.filter(i => i.status === "draft").length})`, icon: <MessageSquare size={14} /> },
        { value: "approvals", label: `Approvals (${approvals.filter(a => a.status === "pending").length})`, icon: <CheckCircle2 size={14} /> },
        { value: "calendar", label: "Calendar", icon: <Calendar size={14} /> },
        { value: "activity", label: "Activity", icon: <Activity size={14} /> },
      ]} />

      {tab === "generate" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <SectionTitle>AI Studio</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {([
                { id: "post", label: "Post", icon: MessageSquare },
                { id: "campaign", label: "Campaign", icon: Megaphone },
                { id: "reply", label: "Reply", icon: Reply },
                { id: "growth", label: "Growth", icon: TrendingUp },
              ] as const).map(a => (
                <button key={a.id} onClick={() => setAction(a.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition flex flex-col items-center gap-1 ${action === a.id ? "border-blue bg-blue/10 text-blue" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  <a.icon size={16} /> {a.label}
                </button>
              ))}
            </div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={5}
              placeholder={action === "reply" ? "Paste a customer message to draft a reply…" : action === "campaign" ? "Describe your campaign (product launch, sale, awareness)…" : action === "growth" ? "What's your current state and growth goal?" : "Describe the post you want…"}
              className="w-full bg-background border border-border rounded-lg p-3 text-sm outline-none focus:border-blue resize-none" />
            <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
              className="mt-3 w-full bg-blue text-white rounded-lg py-2.5 font-medium hover:bg-blue/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Zap size={16} /> Generate ({"-1 credit"})</>}
            </button>
          </Card>

          <Card>
            <SectionTitle>Preview</SectionTitle>
            {!result ? (
              <div className="text-center text-muted-foreground text-sm py-12">
                <Sparkles size={32} className="mx-auto mb-2 opacity-40" />
                Your AI-generated draft will appear here.
              </div>
            ) : <JsonPreview data={result} />}
          </Card>
        </div>
      )}

      {tab === "drafts" && (
        <div className="space-y-3">
          {filteredItems.length === 0 && <Card><p className="text-sm text-muted-foreground text-center py-6">No drafts yet.</p></Card>}
          {filteredItems.map(item => (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {item.type} · {new Date(item.created_at).toLocaleString()} · <StatusBadge status={item.status} />
                  </p>
                </div>
                {profile.config.approvalRequired && item.status === "draft" && (
                  <button onClick={() => sendForApproval(item)} className="text-xs bg-blue text-white px-3 py-1.5 rounded-lg hover:bg-blue/90 shrink-0">
                    Send for approval
                  </button>
                )}
                {!profile.config.approvalRequired && item.status === "draft" && (
                  <button onClick={async () => { await updateItemStatus(item.id, "published"); reloadLists(); toast.success("Published (demo)"); }}
                    className="text-xs bg-teal text-white px-3 py-1.5 rounded-lg hover:bg-teal/90 shrink-0">
                    Publish
                  </button>
                )}
              </div>
              <details><summary className="cursor-pointer text-xs text-blue">View content</summary>
                <div className="mt-2"><JsonPreview data={item.content} /></div>
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
                  <div>
                    <p className="font-semibold text-foreground">{item?.title || a.action}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {a.action} · {new Date(a.created_at).toLocaleString()} · <StatusBadge status={a.status} />
                    </p>
                  </div>
                  {a.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => decide(a, "approved")} className="text-xs bg-teal text-white px-3 py-1.5 rounded-lg hover:bg-teal/90 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Approve
                      </button>
                      <button onClick={() => decide(a, "rejected")} className="text-xs bg-destructive text-white px-3 py-1.5 rounded-lg hover:opacity-90 flex items-center gap-1">
                        <XCircle size={12} /> Reject
                      </button>
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

      {tab === "calendar" && (
        <Card>
          <SectionTitle>Content Calendar</SectionTitle>
          <p className="text-sm text-muted-foreground mb-3">Scheduled & approved posts.</p>
          {items.filter(i => i.status === "approved" || i.status === "published").length === 0
            ? <p className="text-sm text-muted-foreground text-center py-6">Nothing scheduled yet.</p>
            : items.filter(i => i.status === "approved" || i.status === "published").map(i => (
              <div key={i.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{i.title}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(i.created_at).toLocaleDateString()} · {i.type}</p>
                </div>
                <StatusBadge status={i.status} />
              </div>
            ))}
        </Card>
      )}

      {tab === "activity" && (
        <Card>
          <SectionTitle>Activity Log</SectionTitle>
          {activity.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No activity yet.</p>}
          <div className="space-y-2">
            {activity.map(a => (
              <div key={a.id} className="flex items-start gap-2 text-sm border-b border-border pb-2 last:border-0">
                <AlertCircle size={14} className="text-blue mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-foreground">{a.action}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </ServiceLayout>
  );
}

// ===== shared little pieces =====

function SetupForm({ config, setConfig }: { config: any; setConfig: (c: any) => void }) {
  const f = (k: string, label: string, type = "text", placeholder = "") => (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input type={type} value={config[k] || ""} placeholder={placeholder}
        onChange={e => setConfig({ ...config, [k]: e.target.value })}
        className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue" />
    </div>
  );
  const sel = (k: string, label: string, opts: string[]) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select value={config[k] || ""} onChange={e => setConfig({ ...config, [k]: e.target.value })}
        className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue">
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {f("fullName", "Full Name *")}
      {f("companyName", "Company Name *")}
      {f("email", "Email Address *", "email")}
      {f("phone", "Phone Number", "tel")}
      {f("handle", "Social Media Handle", "text", "@yourbrand")}
      {f("username", "Platform Username")}
      {f("businessType", "Business Type", "text", "SaaS, Retail, Agency…")}
      {f("industry", "Industry", "text", "Tech, Fashion, Food…")}
      {f("audience", "Target Audience", "text", "e.g. Startup founders 25-45")}
      {sel("postingFrequency", "Posting Frequency", ["Daily", "3x/week", "Weekly", "Bi-weekly"])}
      {f("contentTypes", "Content Types", "text", "Reels, carousels, stories, blogs")}
      {sel("brandVoice", "Brand Voice", ["Professional", "Friendly", "Playful", "Authoritative", "Bold", "Inspirational"])}
      {f("postingTimes", "Preferred Posting Times")}
      <div className="flex items-center gap-2 sm:col-span-2 pt-2">
        <input type="checkbox" checked={!!config.approvalRequired}
          onChange={e => setConfig({ ...config, approvalRequired: e.target.checked })}
          className="h-4 w-4 accent-[hsl(var(--color-blue))]" />
        <span className="text-sm text-foreground">Require my approval before publishing</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    pending: "bg-yellow-500/10 text-yellow-500",
    approved: "bg-teal/10 text-teal",
    rejected: "bg-destructive/10 text-destructive",
    published: "bg-blue/10 text-blue",
  };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[status] || "bg-muted"}`}>{status}</span>;
}

function JsonPreview({ data }: { data: any }) {
  return (
    <pre className="bg-muted/30 rounded-lg p-3 text-xs text-foreground overflow-auto max-h-96 whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export { SetupForm, StatusBadge, JsonPreview };
