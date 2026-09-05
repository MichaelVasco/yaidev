import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft, Check, ChevronDown, Download, History, Loader2, Play, RefreshCw, Rocket,
  Send, Settings2, Share2, Sparkles, StopCircle, Wand2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PaywallModal from "@/components/PaywallModal";
import ProjectInfoPanel from "@/components/workspace/ProjectInfoPanel";
import ProgrammingPanel from "@/components/workspace/ProgrammingPanel";
import ResultPanel from "@/components/workspace/ResultPanel";
import {
  CATEGORY_LABEL, downloadProject, getSession, projectUrl, workspaceApi,
  type ActivityItem, type WorkspaceSession,
} from "@/lib/workspace-api";

type Run = "queued" | "processing" | "running" | "completed" | "failed";

export default function Workspace() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user, loading, refreshCredits } = useAuth();
  const [session, setSession] = useState<WorkspaceSession | null>(null);
  const [run, setRun] = useState<Run>("queued");
  const [stage, setStage] = useState("queued");
  const [progress, setProgress] = useState(0);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [paywall, setPaywall] = useState(false);
  const [ask, setAsk] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const stopped = useRef(false);
  const started = useRef(false);

  const patchSession = useCallback((p: Partial<WorkspaceSession>) => {
    setSession((s) => (s ? { ...s, ...p } : s));
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate(`/auth?redirect=${encodeURIComponent(`/workspace/${id}`)}`);
  }, [user, loading, id, navigate]);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      try {
        const s = await getSession(id);
        if (!s) { toast.error("Project not found"); navigate("/dashboard"); return; }
        setSession(s);
        setActivity(s.activity);
        setStage(s.stage);
        setProgress(s.progress);
        setRun(s.files.length ? "completed" : "queued");
      } catch (e: any) { toast.error(e.message); }
    })();
  }, [user, id, navigate]);

  const markAll = (status: ActivityItem["status"]) =>
    setActivity((a) => a.map((x) => (x.status === "completed" ? x : { ...x, status })));

  const doPlan = useCallback(async () => {
    if (!session) return null;
    setRun("processing"); setStage("planning"); setProgress(8);
    try {
      const res = await workspaceApi.plan(session.id);
      setActivity(res.activity);
      patchSession({ project_name: res.projectName, slug: res.slug, activity: res.activity });
      setStage("architecture"); setProgress(22);
      return res;
    } catch (e: any) {
      setRun("failed");
      toast.error(e.message);
      return null;
    }
  }, [session, patchSession]);

  const doGenerate = useCallback(async () => {
    if (!session) return;
    stopped.current = false;
    setRun("running"); setStage("coding"); setProgress(40);
    markAll("processing");
    try {
      const res = await workspaceApi.generate(session.id);
      if (stopped.current) return;
      const fresh = await getSession(session.id);
      if (fresh) { setSession(fresh); setActivity(fresh.activity.map((a) => ({ ...a, status: "completed" }))); }
      setStage("completed"); setProgress(100); setRun("completed");
      await refreshCredits();
      toast.success(`Project built — ${res.files.length} files created`);
    } catch (e: any) {
      markAll("pending");
      setRun("failed"); setStage("failed");
      if (e.requiresPayment) { setPaywall(true); return; }
      toast.error(e.message);
    }
  }, [session, refreshCredits]);

  // Auto-start: plan (free) then wait for the user to spend a coin on the build.
  useEffect(() => {
    if (!session || started.current) return;
    started.current = true;
    if (!session.files.length && !session.activity.length) doPlan();
  }, [session, doPlan]);

  const doAsk = async () => {
    const instruction = ask.trim();
    if (!session || !instruction) return;
    setAsk("");
    setRun("running"); setStage("coding"); setProgress(45);
    try {
      await workspaceApi.patch(session.id, instruction);
      const fresh = await getSession(session.id);
      if (fresh) setSession(fresh);
      setStage("completed"); setProgress(100); setRun("completed");
      await refreshCredits();
      toast.success("Project updated");
    } catch (e: any) {
      setRun("completed");
      if (e.requiresPayment) { setPaywall(true); return; }
      toast.error(e.message);
    }
  };

  const restore = async (n: number) => {
    if (!session) return;
    const v = session.versions.find((x) => x.n === n);
    if (!v) return;
    setSession({ ...session, files: v.files });
    toast.success(`Viewing version ${n}`);
  };

  const headline = useMemo(() => {
    if (run === "completed") return "✓ PROJECT COMPLETED";
    if (run === "failed") return "GENERATION STOPPED";
    if (run === "running") return `BUILDING ${CATEGORY_LABEL[session?.category ?? "websites"].toUpperCase()}…`;
    if (run === "processing") return "AI IS PLANNING YOUR PROJECT";
    return "READY TO BUILD";
  }, [run, session]);

  if (loading || !session) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading workspace…</div>;
  }

  const busy = run === "processing" || run === "running";

  return (
    <div className="min-h-screen bg-background">
      {/* Status bar */}
      <div className="sticky top-0 z-30 bg-card/85 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 lg:px-8 py-2.5 max-w-[1500px]">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /></button>
              <div className="min-w-0">
                <p className="font-heading font-bold text-sm text-foreground truncate">{headline}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{stage} · {session.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {busy ? (
                <button onClick={() => { stopped.current = true; setRun("failed"); setStage("stopped"); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-destructive">
                  <StopCircle size={13} /> Stop
                </button>
              ) : (
                <button onClick={doGenerate}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-xs font-semibold"
                  style={{ background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple)))" }}>
                  {session.files.length ? <RefreshCw size={13} /> : <Play size={13} />} {session.files.length ? "Regenerate" : "Build project"}
                </button>
              )}
              <span className="text-xs font-mono text-muted-foreground w-10 text-right">{progress}%</span>
            </div>
          </div>
          <div className="h-1 mt-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full transition-all duration-700"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, hsl(var(--color-blue)), hsl(var(--color-teal)))" }} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-5 max-w-[1500px] space-y-5">
        <ProjectInfoPanel session={session} onChange={patchSession} />

        {/* Ask AI */}
        <div className="bg-card border border-border rounded-2xl p-3 flex items-center gap-2">
          <Wand2 size={16} className="text-purple shrink-0" />
          <input
            value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doAsk()}
            disabled={!session.files.length || busy}
            placeholder={session.files.length ? "Ask YAIDEV to change your project — e.g. “Add login and registration”" : "Build the project first, then ask for changes here"}
            className="flex-1 bg-transparent outline-none text-sm disabled:opacity-50"
          />
          <button onClick={doAsk} disabled={!ask.trim() || busy}
            className="px-3 py-1.5 rounded-lg bg-blue text-white text-xs flex items-center gap-1 disabled:opacity-40">
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Ask AI
          </button>
        </div>

        <div className="grid xl:grid-cols-2 gap-5">
          <ProgrammingPanel session={session} activity={activity} running={busy} />
          <ResultPanel session={session} running={busy} />
        </div>

        {/* Deployment + advanced */}
        {session.files.length > 0 && (
          <section className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Rocket size={15} className="text-teal" />
              <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground">Project ready</h2>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 mb-4">
              <li className="flex items-center gap-1.5"><Check size={12} className="text-teal" /> {CATEGORY_LABEL[session.category]} generated</li>
              <li className="flex items-center gap-1.5"><Check size={12} className="text-teal" /> {session.files.length} project files</li>
              <li className="flex items-center gap-1.5"><Check size={12} className="text-teal" /> YAIDEV address created — <span className="font-mono">{projectUrl(session).replace("https://", "")}</span></li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <Btn onClick={() => window.open(projectUrl(session), "_blank")} icon={<Sparkles size={13} />} label="Open project" primary />
              <Btn onClick={() => downloadProject(session.project_name || "project", session.files)} icon={<Download size={13} />} label="Download" />
              <Btn onClick={() => { navigator.clipboard.writeText(projectUrl(session)); toast.success("Link copied"); }} icon={<Share2 size={13} />} label="Share" />
              <Btn onClick={() => setShowVersions((v) => !v)} icon={<History size={13} />} label={`Versions (${session.versions.length})`} />
              <Btn onClick={() => setAdvanced((v) => !v)} icon={<Settings2 size={13} />} label="Advanced" />
            </div>

            {showVersions && (
              <div className="mt-4 space-y-1.5">
                {session.versions.slice().reverse().map((v) => (
                  <div key={v.n} className="flex items-center justify-between text-xs border-b border-border/60 py-1.5">
                    <span className="text-foreground">Version {v.n} — {v.label}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-muted-foreground">{new Date(v.at).toLocaleString()}</span>
                      <button onClick={() => restore(v.n)} className="text-blue hover:underline">View</button>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {advanced && (
              <div className="mt-4 grid sm:grid-cols-2 gap-2 text-xs">
                <p className="text-muted-foreground">Deployment status: <span className="text-foreground">{session.deployment_status}</span></p>
                <p className="text-muted-foreground">Build session: <span className="font-mono">{session.id.slice(0, 8)}</span></p>
                {(session.result?.deployment?.steps || []).map((s: string, i: number) => (
                  <p key={i} className="text-muted-foreground sm:col-span-2">• {s}</p>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <PaywallModal open={paywall} onClose={() => setPaywall(false)} />
    </div>
  );
}

function Btn({ onClick, icon, label, primary }: { onClick: () => void; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition ${primary ? "text-white" : "border border-border text-muted-foreground hover:text-foreground hover:border-blue/40"}`}
      style={primary ? { background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple)))" } : undefined}>
      {icon}{label}
    </button>
  );
}
