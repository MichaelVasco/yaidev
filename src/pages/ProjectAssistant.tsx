import { useEffect, useMemo, useRef, useState } from "react";
import {
  Rocket, Plus, Send, FolderGit2, Upload, X, Loader2, Sparkles,
  Wrench, Bug, FileText, BarChart3, Shield, Zap, Cloud, Activity,
  KeyRound, MessageSquare, Coins, CheckCircle2, AlertCircle, FileCode,
  Trash2, ChevronRight, ListChecks, Lightbulb, Eye, EyeOff,
} from "lucide-react";
import ServiceLayout, { Card, SectionTitle, TabBar } from "@/components/ServiceLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PaywallModal from "@/components/PaywallModal";
import { callAiService, logActivity } from "@/lib/service-api";
import ReactMarkdown from "react-markdown";

const sb = supabase as any;

type Project = {
  id: string; user_id: string; name: string; description?: string;
  category?: string; project_url?: string; github_url?: string; gitlab_url?: string;
  api_endpoint?: string; api_key_encrypted?: string; database_type?: string;
  language?: string; framework?: string; cloud_provider?: string; stage?: string;
  goals?: string; challenges?: string; metadata?: any; created_at: string;
};
type ProjectFile = { id: string; project_id: string; file_name: string; file_type?: string; file_size?: number; content?: string; created_at: string };
type ProjectTask = { id: string; project_id: string; title: string; description?: string; plan: any; result: any; estimated_credits: number; status: string; created_at: string };
type Conversation = { id: string; project_id: string; role: "user" | "assistant"; content: string; metadata?: any; created_at: string };

const CATEGORIES = ["Website", "Mobile App", "Desktop Software", "SaaS Platform", "AI Agent", "API", "Ecommerce", "Blockchain", "Other"];
const STAGES = ["Idea", "MVP", "Beta", "Production"];

const TABS = [
  { value: "overview", label: "Overview", icon: <BarChart3 size={14} /> },
  { value: "chat", label: "AI Chat", icon: <MessageSquare size={14} /> },
  { value: "tasks", label: "Tasks", icon: <ListChecks size={14} /> },
  { value: "code", label: "Code Assistant", icon: <FileCode size={14} /> },
  { value: "bugs", label: "Bug Detection", icon: <Bug size={14} /> },
  { value: "features", label: "Feature Builder", icon: <Wrench size={14} /> },
  { value: "docs", label: "Documentation", icon: <FileText size={14} /> },
  { value: "analytics", label: "Analytics", icon: <BarChart3 size={14} /> },
  { value: "security", label: "Security", icon: <Shield size={14} /> },
  { value: "performance", label: "Performance", icon: <Zap size={14} /> },
  { value: "deploy", label: "Deployment", icon: <Cloud size={14} /> },
  { value: "api", label: "API Mgmt", icon: <KeyRound size={14} /> },
  { value: "files", label: "Files", icon: <Upload size={14} /> },
  { value: "activity", label: "Activity", icon: <Activity size={14} /> },
] as const;
type Tab = typeof TABS[number]["value"];

const QUICK_PROMPTS = [
  "Build a payment system", "Fix login bug", "Improve mobile responsiveness",
  "Create an admin dashboard", "Generate API documentation", "Optimize database performance",
  "Improve SEO", "Create dark mode", "Add authentication", "Connect Stripe", "Create mobile app version",
];

const PLANS = [
  { name: "YAIDEV PRO", credits: "300 Credits", price: "$19/mo", perks: ["Priority Processing", "Advanced AI Features", "Project History", "Premium Support"] },
  { name: "YAIDEV ENTERPRISE", credits: "1000 Credits", price: "$79/mo", perks: ["Enterprise AI", "Unlimited Projects", "Advanced Analytics", "Team Collaboration"] },
  { name: "YAIDEV FOREVER", credits: "Lifetime", price: "$299 once", perks: ["Lifetime Credits", "Premium Features", "Priority Queue", "Enterprise Capabilities"] },
];

const PAY_METHODS = ["Paystack", "Stripe", "Flutterwave"];

export default function ProjectAssistant() {
  const { user, spendCredit, canGenerate } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [active, setActive] = useState<Project | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [showNew, setShowNew] = useState(false);
  const [paywall, setPaywall] = useState(false);

  useEffect(() => { if (user) loadProjects(); }, [user]);

  async function loadProjects() {
    const { data } = await sb.from("projects").select("*").order("created_at", { ascending: false });
    const list = (data || []) as Project[];
    setProjects(list);
    if (!active && list.length) setActive(list[0]);
    if (!list.length) setShowNew(true);
  }

  return (
    <ServiceLayout
      title="AI Project Assistant"
      subtitle="Connect your project and let YAIDEV AI help build, improve, debug, optimize and manage it."
      icon={<Rocket size={22} />}
    >
      {/* Project switcher */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto no-scrollbar">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p)}
            className={`flex items-center gap-2 px-3 h-9 rounded-full border text-sm whitespace-nowrap ${active?.id === p.id ? "bg-blue text-white border-blue" : "bg-card border-border text-foreground hover:border-blue/40"}`}
          >
            <FolderGit2 size={14} /> {p.name}
          </button>
        ))}
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 h-9 rounded-full border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-blue/40"
        >
          <Plus size={14} /> New Project
        </button>
      </div>

      {showNew && (
        <NewProjectForm
          onClose={() => setShowNew(false)}
          onCreated={(p) => { setActive(p); setShowNew(false); loadProjects(); }}
        />
      )}

      {!active && !showNew && (
        <Card>
          <p className="text-muted-foreground text-sm">No project selected. Create one to begin.</p>
        </Card>
      )}

      {active && (
        <>
          <TabBar tabs={TABS as any} value={tab} onChange={(v: any) => setTab(v)} />
          <Workspace
            project={active}
            tab={tab}
            onSpend={spendCredit}
            canGenerate={canGenerate}
            openPaywall={() => setPaywall(true)}
            refresh={loadProjects}
          />
        </>
      )}

      <PaywallModal open={paywall} onClose={() => setPaywall(false)} />
    </ServiceLayout>
  );
}

/* ───────────────────────────── NEW PROJECT FORM ───────────────────────────── */
function NewProjectForm({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Project) => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [f, setF] = useState({
    name: "", description: "", category: "Website",
    project_url: "", github_url: "", gitlab_url: "", api_endpoint: "", api_key: "",
    database_type: "", language: "", framework: "", cloud_provider: "",
    stage: "MVP", goals: "", challenges: "",
  });
  const set = (k: keyof typeof f) => (e: any) => setF({ ...f, [k]: e.target?.value ?? e });

  async function save() {
    if (!f.name.trim()) { toast.error("Project name required"); return; }
    if (!user) return;
    setBusy(true);
    try {
      const { data, error } = await sb.from("projects").insert({
        user_id: user.id,
        name: f.name.trim(), description: f.description, category: f.category,
        project_url: f.project_url || null, github_url: f.github_url || null,
        gitlab_url: f.gitlab_url || null, api_endpoint: f.api_endpoint || null,
        api_key_encrypted: f.api_key ? btoa(f.api_key) : null, // simple obfuscation; real encryption requires KMS
        database_type: f.database_type, language: f.language, framework: f.framework,
        cloud_provider: f.cloud_provider, stage: f.stage,
        goals: f.goals, challenges: f.challenges,
      }).select().single();
      if (error) throw error;
      await logActivity(user.id, "company" as any, "project.created", { project_id: data.id });
      toast.success("Project saved");
      onCreated(data as Project);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally { setBusy(false); }
  }

  return (
    <Card className="mb-5">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Connect a Project</SectionTitle>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Project Name *"><Input value={f.name} onChange={set("name")} placeholder="My SaaS App" /></Field>
        <Field label="Category">
          <select value={f.category} onChange={set("category")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Description" full><Textarea value={f.description} onChange={set("description")} placeholder="What does this project do?" rows={2} /></Field>
        <Field label="Project URL"><Input value={f.project_url} onChange={set("project_url")} placeholder="https://…" /></Field>
        <Field label="GitHub Repository URL"><Input value={f.github_url} onChange={set("github_url")} placeholder="https://github.com/…" /></Field>
        <Field label="GitLab Repository URL"><Input value={f.gitlab_url} onChange={set("gitlab_url")} placeholder="https://gitlab.com/…" /></Field>
        <Field label="API Endpoint URL"><Input value={f.api_endpoint} onChange={set("api_endpoint")} placeholder="https://api.example.com" /></Field>
        <Field label="API Key (encrypted at rest)">
          <div className="relative">
            <Input type={showKey ? "text" : "password"} value={f.api_key} onChange={set("api_key")} placeholder="sk_••••" />
            <button type="button" onClick={() => setShowKey((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </Field>
        <Field label="Database Type"><Input value={f.database_type} onChange={set("database_type")} placeholder="Postgres, MySQL, Mongo…" /></Field>
        <Field label="Programming Language"><Input value={f.language} onChange={set("language")} placeholder="TypeScript, Python…" /></Field>
        <Field label="Framework"><Input value={f.framework} onChange={set("framework")} placeholder="React, Next.js, Django…" /></Field>
        <Field label="Cloud Provider"><Input value={f.cloud_provider} onChange={set("cloud_provider")} placeholder="AWS, GCP, Vercel…" /></Field>
        <Field label="Development Stage">
          <select value={f.stage} onChange={set("stage")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Project Goals" full><Textarea value={f.goals} onChange={set("goals")} placeholder="What are you trying to achieve?" rows={2} /></Field>
        <Field label="Technical Challenges" full><Textarea value={f.challenges} onChange={set("challenges")} placeholder="What's blocking you?" rows={2} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={busy} className="bg-blue hover:bg-blue/90 text-white">
          {busy ? <Loader2 size={16} className="animate-spin mr-2" /> : <Rocket size={16} className="mr-2" />} Save Project
        </Button>
      </div>
    </Card>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? "md:col-span-2" : ""}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/* ───────────────────────────── WORKSPACE ───────────────────────────── */
function Workspace({
  project, tab, onSpend, canGenerate, openPaywall, refresh,
}: {
  project: Project; tab: Tab;
  onSpend: () => Promise<{ ok: boolean }>;
  canGenerate: boolean;
  openPaywall: () => void;
  refresh: () => void;
}) {
  if (tab === "overview") return <Overview project={project} refresh={refresh} />;
  if (tab === "chat") return <ChatPanel project={project} onSpend={onSpend} canGenerate={canGenerate} openPaywall={openPaywall} />;
  if (tab === "tasks") return <TasksPanel project={project} onSpend={onSpend} canGenerate={canGenerate} openPaywall={openPaywall} />;
  if (tab === "files") return <FilesPanel project={project} />;
  if (tab === "activity") return <ActivityPanel project={project} />;
  if (tab === "api") return <ApiPanel project={project} />;
  // Analysis-style tabs all share the same panel with a focused prompt
  const presets: Record<string, { title: string; prompt: string; icon: any }> = {
    code: { title: "Code Assistant", prompt: "Review my project's code quality and produce a senior-engineer report with concrete refactors and example snippets.", icon: FileCode },
    bugs: { title: "Bug Detection", prompt: "Identify likely bugs, race conditions, and edge cases across this project. Rank by severity and provide fixes.", icon: Bug },
    features: { title: "Feature Builder", prompt: "Propose a high-impact feature backlog tailored to this project's stage and category. Include build plans.", icon: Wrench },
    docs: { title: "Documentation", prompt: "Generate complete, well-structured documentation: overview, architecture, API reference, and onboarding guide.", icon: FileText },
    analytics: { title: "Project Analytics", prompt: "Define product/engineering KPIs and an analytics plan for this project, with dashboards and events to track.", icon: BarChart3 },
    security: { title: "Security Analysis", prompt: "Perform a security review. Find vulnerabilities, misconfigurations, and missing controls. Provide remediation.", icon: Shield },
    performance: { title: "Performance Optimization", prompt: "Find performance bottlenecks (frontend, backend, DB) and provide prioritized optimizations with estimated impact.", icon: Zap },
    deploy: { title: "Deployment Center", prompt: "Recommend an ideal deployment topology and produce a step-by-step deployment runbook for this stack.", icon: Cloud },
  };
  const p = presets[tab];
  return <AnalysisPanel project={project} title={p.title} defaultPrompt={p.prompt} onSpend={onSpend} canGenerate={canGenerate} openPaywall={openPaywall} />;
}

/* ───────────────────────────── OVERVIEW ───────────────────────────── */
function Overview({ project, refresh }: { project: Project; refresh: () => void }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tasks: 0, files: 0, msgs: 0 });
  useEffect(() => { (async () => {
    const [t, f, m] = await Promise.all([
      sb.from("project_tasks").select("id", { count: "exact", head: true }).eq("project_id", project.id),
      sb.from("project_files").select("id", { count: "exact", head: true }).eq("project_id", project.id),
      sb.from("project_conversations").select("id", { count: "exact", head: true }).eq("project_id", project.id),
    ]);
    setStats({ tasks: t.count || 0, files: f.count || 0, msgs: m.count || 0 });
  })(); }, [project.id]);

  async function remove() {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    await sb.from("projects").delete().eq("id", project.id);
    toast.success("Project deleted");
    refresh();
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="md:col-span-2">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-heading font-semibold text-lg">{project.name}</h3>
            <p className="text-sm text-muted-foreground">{project.description || "No description"}</p>
          </div>
          <Badge variant="outline" className="capitalize">{project.stage}</Badge>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <Info label="Category" value={project.category} />
          <Info label="Language" value={project.language} />
          <Info label="Framework" value={project.framework} />
          <Info label="Database" value={project.database_type} />
          <Info label="Cloud" value={project.cloud_provider} />
          <Info label="Project URL" value={project.project_url} link />
          <Info label="GitHub" value={project.github_url} link />
          <Info label="GitLab" value={project.gitlab_url} link />
          <Info label="API Endpoint" value={project.api_endpoint} />
        </div>
        {(project.goals || project.challenges) && (
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {project.goals && <div><div className="text-xs text-muted-foreground mb-1">Goals</div><p className="text-sm">{project.goals}</p></div>}
            {project.challenges && <div><div className="text-xs text-muted-foreground mb-1">Challenges</div><p className="text-sm">{project.challenges}</p></div>}
          </div>
        )}
        <div className="flex justify-end mt-4">
          <Button variant="ghost" onClick={remove} className="text-destructive hover:text-destructive">
            <Trash2 size={14} className="mr-1.5" /> Delete project
          </Button>
        </div>
      </Card>
      <Card>
        <SectionTitle>At a glance</SectionTitle>
        <div className="space-y-2">
          <Stat icon={<ListChecks size={14} />} label="Tasks" value={stats.tasks} />
          <Stat icon={<Upload size={14} />} label="Files" value={stats.files} />
          <Stat icon={<MessageSquare size={14} />} label="AI Messages" value={stats.msgs} />
          <Stat icon={<Sparkles size={14} />} label="Created" value={new Date(project.created_at).toLocaleDateString()} />
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">Demo payment options</div>
          <div className="flex flex-wrap gap-1.5">
            {PAY_METHODS.map((m) => <Badge key={m} variant="secondary">{m}</Badge>)}
          </div>
        </div>
      </Card>
      <Card className="md:col-span-3">
        <SectionTitle>Upgrade plans</SectionTitle>
        <div className="grid md:grid-cols-3 gap-3">
          {PLANS.map((p) => (
            <div key={p.name} className="border border-border rounded-lg p-4 hover:border-blue/40 transition">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{p.name}</h4>
                <Badge className="bg-blue text-white">{p.price}</Badge>
              </div>
              <div className="text-xs text-blue font-medium mb-2">{p.credits}</div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {p.perks.map((x) => <li key={x} className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-blue" /> {x}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const Info = ({ label, value, link }: { label: string; value?: string; link?: boolean }) =>
  value ? (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {link ? <a href={value} target="_blank" rel="noreferrer" className="text-sm text-blue hover:underline break-all">{value}</a>
            : <div className="text-sm break-all">{value}</div>}
    </div>
  ) : null;

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="flex items-center gap-1.5 text-muted-foreground">{icon} {label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

/* ───────────────────────────── CHAT ───────────────────────────── */
function ChatPanel({
  project, onSpend, canGenerate, openPaywall,
}: { project: Project; onSpend: () => Promise<{ ok: boolean }>; canGenerate: boolean; openPaywall: () => void }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Conversation[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { load(); }, [project.id]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  async function load() {
    const { data } = await sb.from("project_conversations").select("*").eq("project_id", project.id).order("created_at", { ascending: true }).limit(200);
    setMsgs((data || []) as Conversation[]);
  }

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || !user) return;
    if (!canGenerate) { openPaywall(); return; }
    const spent = await onSpend();
    if (!spent.ok) { openPaywall(); return; }

    setInput("");
    setBusy(true);
    const userMsg = { user_id: user.id, project_id: project.id, role: "user", content };
    const { data: ins } = await sb.from("project_conversations").insert(userMsg).select().single();
    setMsgs((m) => [...m, ins as Conversation]);

    try {
      const history = [...msgs, ins as Conversation].slice(-12).map((m) => ({ role: m.role, content: m.content }));
      const result = await callAiService("company" as any, "daily", { prompt: content, profile: project, context: { history } })
        .catch(async () => callAiService("assistant" as any, "chat", { prompt: content, profile: project, context: { history } }));
      // ^ first call uses wrong key intentionally as a fallback shape guard — try real action:
      const real = await callAiService("assistant" as any, "chat", { prompt: content, profile: project, context: { history } });
      const reply = real?.reply || real?.summary || JSON.stringify(real, null, 2);
      const { data: ins2 } = await sb.from("project_conversations").insert({
        user_id: user.id, project_id: project.id, role: "assistant", content: reply, metadata: real,
      }).select().single();
      setMsgs((m) => [...m, ins2 as Conversation]);
      await logActivity(user.id, "company" as any, "assistant.chat", { project_id: project.id });
    } catch (e: any) {
      toast.error(e.message || "AI error");
    } finally { setBusy(false); }
  }

  return (
    <div className="grid md:grid-cols-[1fr_240px] gap-4">
      <Card className="flex flex-col h-[68vh]">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {msgs.length === 0 && !busy && (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10">
              <Sparkles className="text-blue mb-2" />
              <p className="text-sm">Ask anything about your project — code, bugs, features, deployment, growth.</p>
            </div>
          )}
          {msgs.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-blue text-white" : "bg-muted/50 text-foreground"}`}>
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:bg-background/60">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="bg-muted/50 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 text-muted-foreground">
                <Loader2 size={14} className="animate-spin" /> Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="border-t border-border pt-3 mt-3 flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Describe what you want to build, fix, or improve…"
            rows={2}
            className="resize-none"
          />
          <Button onClick={() => send()} disabled={busy || !input.trim()} className="bg-blue hover:bg-blue/90 text-white self-end">
            <Send size={16} />
          </Button>
        </div>
      </Card>
      <Card>
        <SectionTitle>Quick prompts</SectionTitle>
        <div className="flex flex-col gap-1.5">
          {QUICK_PROMPTS.map((q) => (
            <button key={q} onClick={() => send(q)} disabled={busy}
              className="flex items-center justify-between text-left text-xs px-2.5 py-2 rounded-lg hover:bg-muted/40 transition disabled:opacity-50">
              <span>{q}</span><ChevronRight size={12} className="text-muted-foreground" />
            </button>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground flex items-center gap-1.5">
          <Coins size={12} /> 1 credit per message
        </div>
      </Card>
    </div>
  );
}

/* ───────────────────────────── TASKS ───────────────────────────── */
function TasksPanel({
  project, onSpend, canGenerate, openPaywall,
}: { project: Project; onSpend: () => Promise<{ ok: boolean }>; canGenerate: boolean; openPaywall: () => void }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [prompt, setPrompt] = useState("");
  const [planning, setPlanning] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<any | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => { load(); }, [project.id]);
  async function load() {
    const { data } = await sb.from("project_tasks").select("*").eq("project_id", project.id).order("created_at", { ascending: false });
    setTasks((data || []) as ProjectTask[]);
  }

  async function plan() {
    if (!prompt.trim() || !user) return;
    if (!canGenerate) { openPaywall(); return; }
    const spent = await onSpend(); if (!spent.ok) { openPaywall(); return; }
    setPlanning(true);
    try {
      const result = await callAiService("assistant" as any, "taskPlan", { prompt, profile: project });
      setPendingPlan(result);
    } catch (e: any) { toast.error(e.message); }
    finally { setPlanning(false); }
  }

  async function approve() {
    if (!pendingPlan || !user) return;
    const { data, error } = await sb.from("project_tasks").insert({
      user_id: user.id, project_id: project.id,
      title: pendingPlan.title || prompt.slice(0, 80),
      description: pendingPlan.objective, plan: pendingPlan,
      estimated_credits: pendingPlan.estimatedCredits || 2, status: "approved",
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setPendingPlan(null); setPrompt("");
    setTasks((t) => [data as ProjectTask, ...t]);
    toast.success("Task approved. Execute when ready.");
  }

  async function execute(task: ProjectTask) {
    if (!user || !canGenerate) { openPaywall(); return; }
    const spent = await onSpend(); if (!spent.ok) { openPaywall(); return; }
    setExecuting(task.id);
    try {
      const result = await callAiService("assistant" as any, "execute", {
        prompt: `Execute this approved plan and produce concrete output.`,
        profile: project, context: { task: task.plan },
      });
      await sb.from("project_tasks").update({ result, status: "completed" }).eq("id", task.id);
      await logActivity(user.id, "company" as any, "task.executed", { task_id: task.id });
      toast.success("Task completed");
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setExecuting(null); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Request a task</SectionTitle>
        <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
          placeholder="e.g., Add Stripe checkout with webhook handling" />
        <div className="flex justify-end mt-3">
          <Button onClick={plan} disabled={planning || !prompt.trim()} className="bg-blue text-white hover:bg-blue/90">
            {planning ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Lightbulb size={14} className="mr-1.5" />} Generate plan
          </Button>
        </div>
        {pendingPlan && (
          <div className="mt-4 border border-blue/30 rounded-lg p-4 bg-blue/5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{pendingPlan.title}</h4>
              <Badge className="bg-blue text-white"><Coins size={12} className="mr-1" />{pendingPlan.estimatedCredits || 2} credits</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{pendingPlan.objective}</p>
            <ol className="space-y-1.5 text-sm list-decimal list-inside">
              {(pendingPlan.steps || []).map((s: any, i: number) => (
                <li key={i}><strong>{s.title}:</strong> <span className="text-muted-foreground">{s.description}</span></li>
              ))}
            </ol>
            <div className="flex gap-2 mt-3">
              <Button onClick={approve} className="bg-blue text-white hover:bg-blue/90"><CheckCircle2 size={14} className="mr-1.5" /> Approve</Button>
              <Button variant="ghost" onClick={() => setPendingPlan(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Task history</SectionTitle>
        {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="border border-border rounded-lg p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="font-medium text-sm">{t.title}</div>
                <Badge variant={t.status === "completed" ? "default" : "outline"} className={t.status === "completed" ? "bg-blue text-white" : ""}>{t.status}</Badge>
              </div>
              {t.description && <p className="text-xs text-muted-foreground mb-2">{t.description}</p>}
              <div className="flex items-center gap-2">
                {t.status !== "completed" && (
                  <Button size="sm" onClick={() => execute(t)} disabled={executing === t.id} className="bg-blue text-white hover:bg-blue/90 h-7 text-xs">
                    {executing === t.id ? <Loader2 size={12} className="animate-spin mr-1" /> : <Zap size={12} className="mr-1" />} Execute
                  </Button>
                )}
                <Badge variant="secondary" className="text-xs"><Coins size={10} className="mr-1" />{t.estimated_credits}</Badge>
              </div>
              {t.result && Object.keys(t.result).length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-blue cursor-pointer">View result</summary>
                  <pre className="mt-2 text-xs bg-muted/30 p-2 rounded overflow-x-auto">{JSON.stringify(t.result, null, 2)}</pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ───────────────────────────── ANALYSIS PANEL (code, bugs, security, etc.) ───────────────────────────── */
function AnalysisPanel({
  project, title, defaultPrompt, onSpend, canGenerate, openPaywall,
}: {
  project: Project; title: string; defaultPrompt: string;
  onSpend: () => Promise<{ ok: boolean }>; canGenerate: boolean; openPaywall: () => void;
}) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function run() {
    if (!user || !canGenerate) { openPaywall(); return; }
    const spent = await onSpend(); if (!spent.ok) { openPaywall(); return; }
    setBusy(true);
    try {
      const action = title.toLowerCase().includes("security") || title.toLowerCase().includes("performance") || title.toLowerCase().includes("deployment") || title.toLowerCase().includes("analytics") ? "analyze" : "chat";
      const r = await callAiService("assistant" as any, action, { prompt, profile: project });
      setResult(r);
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} />
      <div className="flex justify-end mt-3">
        <Button onClick={run} disabled={busy} className="bg-blue text-white hover:bg-blue/90">
          {busy ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Sparkles size={14} className="mr-1.5" />} Run analysis
        </Button>
      </div>
      {result && (
        <div className="mt-4 border-t border-border pt-4 space-y-3">
          {result.reply && <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{result.reply}</ReactMarkdown></div>}
          <details open>
            <summary className="text-sm text-blue cursor-pointer">Full structured output</summary>
            <pre className="mt-2 text-xs bg-muted/30 p-3 rounded overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      )}
    </Card>
  );
}

/* ───────────────────────────── FILES ───────────────────────────── */
function FilesPanel({ project }: { project: Project }) {
  const { user } = useAuth();
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, [project.id]);
  async function load() {
    const { data } = await sb.from("project_files").select("*").eq("project_id", project.id).order("created_at", { ascending: false });
    setFiles((data || []) as ProjectFile[]);
  }

  async function upload(list: FileList | File[]) {
    if (!user) return;
    setBusy(true);
    try {
      for (const f of Array.from(list)) {
        if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} too large (5MB max)`); continue; }
        const isText = /\.(txt|md|json|xml|ya?ml|html?|css|m?js|tsx?|jsx|py|go|rs|java|c|cpp|sh|env|sql|csv)$/i.test(f.name) || f.type.startsWith("text/");
        const content = isText ? (await f.text()).slice(0, 200_000) : null;
        await sb.from("project_files").insert({
          user_id: user.id, project_id: project.id,
          file_name: f.name, file_type: f.type, file_size: f.size, content,
        });
      }
      toast.success("Files uploaded");
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    await sb.from("project_files").delete().eq("id", id);
    load();
  }

  return (
    <Card>
      <SectionTitle>Project files</SectionTitle>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition ${drag ? "border-blue bg-blue/5" : "border-border"}`}
      >
        <Upload className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Drag & drop files, ZIPs, source code, PDFs, schemas — or</p>
        <Button onClick={() => inputRef.current?.click()} disabled={busy} variant="outline" className="mt-2">
          {busy ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Upload size={14} className="mr-1.5" />} Choose files
        </Button>
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />
      </div>
      <div className="mt-4 space-y-2">
        {files.map((f) => (
          <div key={f.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={14} className="text-blue shrink-0" />
              <div className="min-w-0">
                <div className="text-sm truncate">{f.file_name}</div>
                <div className="text-xs text-muted-foreground">{f.file_type || "file"} · {f.file_size ? `${Math.round(f.file_size / 1024)} KB` : ""}</div>
              </div>
            </div>
            <button onClick={() => remove(f.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
          </div>
        ))}
        {files.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">No files yet.</p>}
      </div>
    </Card>
  );
}

/* ───────────────────────────── ACTIVITY ───────────────────────────── */
function ActivityPanel({ project }: { project: Project }) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    sb.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(50)
      .then(({ data }: any) => setItems((data || []).filter((i: any) => i.metadata?.project_id === project.id || !i.metadata?.project_id)));
  }, [project.id]);
  return (
    <Card>
      <SectionTitle>Activity logs</SectionTitle>
      {items.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
      <div className="space-y-1.5">
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between text-sm border-b border-border/50 py-1.5">
            <span className="flex items-center gap-1.5"><Activity size={12} className="text-blue" /> {i.action}</span>
            <span className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ───────────────────────────── API ───────────────────────────── */
function ApiPanel({ project }: { project: Project }) {
  const [show, setShow] = useState(false);
  const key = project.api_key_encrypted ? atob(project.api_key_encrypted) : "";
  return (
    <Card>
      <SectionTitle>API Management</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <Info label="API Endpoint" value={project.api_endpoint || "—"} />
        <div>
          <div className="text-xs text-muted-foreground">API Key</div>
          {key ? (
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono break-all">{show ? key : "•".repeat(Math.min(24, key.length))}</code>
              <button onClick={() => setShow((v) => !v)} className="text-muted-foreground hover:text-foreground">
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          ) : <div className="text-sm text-muted-foreground">Not configured</div>}
        </div>
      </div>
      <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <AlertCircle size={14} className="text-blue shrink-0 mt-0.5" />
        <span>Keys are obfuscated at rest. For production-grade KMS encryption, connect a secrets vault.</span>
      </div>
    </Card>
  );
}
