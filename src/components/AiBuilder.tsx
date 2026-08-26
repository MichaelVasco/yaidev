import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Sparkles, Send, CheckCircle2,
  Globe, Smartphone, Monitor, Gamepad2, Bot, ImageIcon,
  Hexagon, Video, Music, PenTool, Wand2, BrainCircuit,
  Download, Copy, RotateCcw, Crown, Coins,
  Activity, Cpu, Zap, CircleDot, AlertCircle, Code2, ExternalLink,
  Paperclip, UploadCloud, X, FileText, FileArchive, FileAudio, FileVideo, File as FileIcon,
  Share2, Mail, Building2, Rocket
} from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import PaywallModal from "@/components/PaywallModal";
import FloatingParticles from "@/components/FloatingParticles";
import AiAgents from "@/components/AiAgents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Attachment = {
  id: string;
  name: string;
  mime: string;
  size: number;
  kind: "image" | "text" | "pdf" | "audio" | "video" | "archive" | "doc" | "other";
  dataUrl?: string;
  textContent?: string;
  previewUrl?: string;
  progress: number;
};

const MAX_FILES = 6;
const MAX_SIZE = 20 * 1024 * 1024;
const TEXT_TRUNCATE = 60_000;

const ACCEPT = "image/*,application/pdf,.doc,.docx,.txt,.md,.json,.csv,.xml,.yml,.yaml,.html,.css,.js,.ts,.tsx,.jsx,.py,.go,.rs,.java,.c,.cpp,.zip,.rar,.7z,audio/*,video/*";

const kindFromMime = (m: string, name: string): Attachment["kind"] => {
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("audio/")) return "audio";
  if (m.startsWith("video/")) return "video";
  if (m === "application/pdf") return "pdf";
  if (/zip|rar|7z|x-tar|gzip/.test(m) || /\.(zip|rar|7z)$/i.test(name)) return "archive";
  if (/word|officedocument|msword/.test(m) || /\.(docx?|rtf)$/i.test(name)) return "doc";
  if (m.startsWith("text/") || /\.(txt|md|json|csv|xml|ya?ml|html?|css|m?js|tsx?|jsx|py|go|rs|java|c|cpp|sh|env)$/i.test(name)) return "text";
  return "other";
};

const iconForKind = (k: Attachment["kind"]) => {
  switch (k) {
    case "image": return ImageIcon;
    case "audio": return FileAudio;
    case "video": return FileVideo;
    case "archive": return FileArchive;
    case "pdf":
    case "doc":
    case "text": return FileText;
    default: return FileIcon;
  }
};

const formatBytes = (b: number) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;



const categories = [
  { value: "websites", label: "Websites", icon: Globe, color: "blue",
    desc: "Build complete responsive websites from natural-language instructions." },
  { value: "apps", label: "Apps", icon: Smartphone, color: "purple",
    desc: "Build mobile and web applications from natural-language instructions." },
  { value: "software", label: "Software", icon: Monitor, color: "teal",
    desc: "Build software products, dashboards, SaaS platforms and business systems." },
  { value: "games", label: "Games", icon: Gamepad2, color: "cyan",
    desc: "Build playable games and interactive gaming experiences." },
  { value: "robots", label: "Robots", icon: Bot, color: "blue",
    desc: "Build software and AI systems that control, operate or integrate with robotics." },
  { value: "agents", label: "AI Agents", icon: BrainCircuit, color: "purple",
    desc: "Build autonomous agents that use tools, follow workflows and call external services." },
  { value: "models", label: "AI Models", icon: Cpu, color: "teal",
    desc: "Build, configure, fine-tune, orchestrate or deploy AI/ML model-powered systems." },
] as const;

type Category = (typeof categories)[number]["value"];
const imageCategories: string[] = [];

const VIDEO_STYLES = ["Promotional", "AI Commercial", "Product", "Explainer", "Social Media", "Cinematic", "Animation"];
const VIDEO_DURATIONS = ["15s", "30s", "60s", "90s"];
const VIDEO_RESOLUTIONS = ["720p", "1080p", "4K"];


const AiPulse = ({ color = "blue" }: { color?: string }) => (
  <span className="relative flex h-2.5 w-2.5">
    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${color}/60 opacity-75`} />
    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 bg-${color}`} />
  </span>
);

const colorMap: Record<string, string> = {
  blue: "text-blue", purple: "text-purple", teal: "text-teal", cyan: "text-cyan",
};
const bgMap: Record<string, string> = {
  blue: "bg-blue/10 group-hover:bg-blue/20",
  purple: "bg-purple/10 group-hover:bg-purple/20",
  teal: "bg-teal/10 group-hover:bg-teal/20",
  cyan: "bg-cyan/10 group-hover:bg-cyan/20",
};

const loadingSteps = [
  { label: "Analyzing requirements", icon: Activity, color: "text-blue" },
  { label: "Planning architecture", icon: Cpu, color: "text-purple" },
  { label: "Generating output", icon: Zap, color: "text-teal" },
  { label: "Finalizing deliverable", icon: CircleDot, color: "text-cyan" },
];

const AiBuilder = ({
  onBack,
  initialPrompt = "",
  resumeSessionId = null,
}: { onBack: () => void; initialPrompt?: string; resumeSessionId?: string | null }) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [phase, setPhase] = useState<"select" | "prompt" | "loading" | "preview" | "result">("select");
  const [progress, setProgress] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState<"complete_build" | "out_of_coins" | "preview_limit" | "upgrade">("complete_build");
  const [result, setResult] = useState<any>(null);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAgents, setShowAgents] = useState(false);
  const [videoStyle, setVideoStyle] = useState(VIDEO_STYLES[0]);
  const [videoDuration, setVideoDuration] = useState(VIDEO_DURATIONS[1]);
  const [videoResolution, setVideoResolution] = useState(VIDEO_RESOLUTIONS[1]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeHandled = useRef(false);

  const { user, accessStatus, canUse, coinsRemaining, isLifetime, refreshCredits } = useCredits();
  const navigate = useNavigate();

  const selectedCat = categories.find((c) => c.value === category);
  const isImage = !!category && imageCategories.includes(category);
  const isVideo = false;

  const handleSelect = (val: Category) => {
    if (val === "agents") { setShowAgents(true); return; }
    setCategory(val); setPhase("prompt");
  };

  // ── Resume a paid build after the payment redirect (or from the dashboard) ──
  useEffect(() => {
    if (!resumeSessionId || !user || resumeHandled.current) return;
    resumeHandled.current = true;
    (async () => {
      const { data } = await supabase
        .from("build_sessions")
        .select("id, category, prompt, preview, result, state")
        .eq("id", resumeSessionId)
        .maybeSingle();
      if (!data) return;
      const s = data as any;
      setSessionId(s.id);
      setCategory(s.category as Category);
      setPrompt(s.prompt || "");
      if (s.result && Object.keys(s.result).length) {
        setResult(s.result); setPhase("result"); return;
      }
      if (s.preview && Object.keys(s.preview).length) setPreviewResult(s.preview);
      setPhase("preview");
      toast.success("Payment confirmed — resuming your build");
      // Continue automatically now that the plan is active.
      setTimeout(() => runFullBuild(s.id, s.category, s.prompt), 400);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeSessionId, user]);

  if (showAgents) return <AiAgents onBack={() => setShowAgents(false)} />;


  const uploading = attachments.some((a) => a.progress < 100);

  const readFileSmart = (file: File): Promise<Attachment> =>
    new Promise((resolve, reject) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const kind = kindFromMime(file.type, file.name);
      const base: Attachment = {
        id, name: file.name, mime: file.type || "application/octet-stream",
        size: file.size, kind, progress: 0,
      };
      if (kind === "image" || kind === "audio" || kind === "video") {
        base.previewUrl = URL.createObjectURL(file);
      }
      setAttachments((prev) => [...prev, base]);

      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.min(95, Math.round((e.loaded / e.total) * 95));
          setAttachments((prev) => prev.map((a) => a.id === id ? { ...a, progress: pct } : a));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const done: Attachment = { ...base, progress: 100, previewUrl: base.previewUrl };
        if (kind === "image") done.dataUrl = reader.result as string;
        else if (kind === "text") done.textContent = (reader.result as string).slice(0, TEXT_TRUNCATE);
        setAttachments((prev) => prev.map((a) => a.id === id ? done : a));
        resolve(done);
      };
      if (kind === "image") reader.readAsDataURL(file);
      else if (kind === "text") reader.readAsText(file);
      else {
        // metadata-only for pdf/doc/zip/audio/video — mark complete after a tiny tick
        setTimeout(() => {
          setAttachments((prev) => prev.map((a) => a.id === id ? { ...a, progress: 100 } : a));
          resolve({ ...base, progress: 100 });
        }, 200);
      }
    });

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (attachments.length + list.length > MAX_FILES) {
      toast.error(`Up to ${MAX_FILES} files allowed`); return;
    }
    for (const f of list) {
      if (f.size > MAX_SIZE) { toast.error(`${f.name} exceeds 20MB limit`); continue; }
      try { await readFileSmart(f); } catch (e) { console.error(e); toast.error(`Failed to read ${f.name}`); }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const a = prev.find((x) => x.id === id);
      if (a?.previewUrl) URL.revokeObjectURL(a.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const invokeWithRetry = async (
    fn: "ai-image" | "ai-generate",
    payload: any,
    maxAttempts = 2,
  ): Promise<any> => {
    let lastErrorMsg = "Generation failed. Please try again.";
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke(fn, { body: payload });
        if (error) {
          // Supabase wraps non-2xx as a generic message — translate it.
          lastErrorMsg = "Temporary server issue. Please try again.";
          console.warn(`[${fn}] invoke error attempt ${attempt}:`, error);
        } else if ((data as any)?.error) {
          lastErrorMsg = (data as any).error;
          const fallback = (data as any).fallback === true;
          if (!fallback) throw new Error(lastErrorMsg);
          console.warn(`[${fn}] fallback error attempt ${attempt}:`, lastErrorMsg);
        } else {
          return data;
        }
      } catch (e: any) {
        // Hard error (thrown from non-fallback path) — bubble up immediately.
        if (e?.message && e.message !== "Temporary server issue. Please try again.") throw e;
        lastErrorMsg = e?.message || lastErrorMsg;
        console.warn(`[${fn}] thrown attempt ${attempt}:`, e);
      }
      if (attempt < maxAttempts) {
        toast.message("AI generation failed. Retrying…");
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
    throw new Error(lastErrorMsg);
  };

  const handleBuild = async () => {
    if (!prompt.trim() || !category) return;
    if (uploading) { toast.error("Please wait for uploads to finish"); return; }
    if (!user) { navigate("/auth?redirect=/"); return; }
    if (!canUse) { setShowPaywall(true); return; }
    const spend = await spendCredit();
    if (!spend.ok) { setShowPaywall(true); return; }

    setPhase("loading");
    setProgress(5);
    setError(null);
    setResult(null);
    setImages([]);

    const tick = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.max(1, Math.round((92 - p) / 12)) : p));
    }, 600);

    const payloadAttachments = attachments.map((a) => ({
      name: a.name, mime: a.mime, size: a.size, kind: a.kind,
      dataUrl: a.kind === "image" ? a.dataUrl : undefined,
      textContent: a.kind === "text" ? a.textContent : undefined,
    }));

    try {
      if (isImage) {
        const data = await invokeWithRetry("ai-image", {
          category, prompt, variants: 3, attachments: payloadAttachments,
        });
        setImages((data as any).images || []);
      } else {
        const fullPrompt = isVideo
          ? `${prompt}\n\nProduction specs:\n- Style: ${videoStyle}\n- Duration: ${videoDuration}\n- Resolution: ${videoResolution}`
          : prompt;
        const data = await invokeWithRetry("ai-generate", {
          category, prompt: fullPrompt, attachments: payloadAttachments,
        });
        setResult((data as any).result);
      }
      setProgress(100);
      setTimeout(() => setPhase("result"), 350);
    } catch (e: any) {
      console.error("[handleBuild] failed:", e);
      const msg = e?.message || "Temporary server issue. Please try again.";
      setError(msg);
      toast.error(msg);
      setPhase("prompt");
    } finally {
      clearInterval(tick);
    }
  };

  const handleReset = () => {
    setPhase("select"); setCategory(null); setPrompt("");
    setProgress(0); setResult(null); setImages([]); setError(null);
    attachments.forEach((a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
    setAttachments([]);
  };


  const copyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast.success("Copied to clipboard");
  };

  const downloadHtml = () => {
    if (!result?.previewHtml) return;
    const blob = new Blob([result.previewHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(result.title || "yaidev-output").replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadImage = (url: string, i: number) => {
    const a = document.createElement("a");
    a.href = url; a.download = `yaidev-${category}-${i + 1}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-blue/[0.04] blur-[120px]" />
        <motion.div animate={{ x: [0, -25, 0], y: [0, 15, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple/[0.04] blur-[100px]" />
      </div>
      <FloatingParticles count={35} className="opacity-30 fixed" />

      <div className="glass fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="h-5 w-px bg-border" />
            <span className="font-heading font-bold text-sm text-gradient">YAIDEV</span>
            <span className="text-muted-foreground text-sm">/ AI Builder</span>
            {phase === "loading" && (
              <div className="flex items-center gap-2 ml-2">
                <AiPulse color="blue" />
                <span className="text-xs text-blue font-medium animate-pulse">Processing</span>
              </div>
            )}
          </div>

          <button onClick={() => setShowPaywall(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card card-glow hover:border-blue/20 transition-all text-sm">
            {isLifetime ? (<><Crown size={14} className="text-blue" /><span className="font-medium text-blue">Unlimited</span></>)
              : accessStatus === "subscribed" ? (<><Sparkles size={14} className="text-purple" /><span className="font-medium text-purple">Pro</span></>)
              : (<><Coins size={14} className={coinsRemaining > 5 ? "text-blue" : "text-destructive"} /><span className={`font-medium ${coinsRemaining > 5 ? "text-foreground" : "text-destructive"}`}>{coinsRemaining} coins</span></>)}
          </button>
        </div>
      </div>

      <div className="pt-28 pb-20 container mx-auto px-4">
        <AnimatePresence mode="wait">

          {phase === "select" && (
            <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 relative" style={{ background: "linear-gradient(135deg, hsl(var(--color-blue) / 0.15), hsl(var(--color-purple) / 0.15))" }}>
                  <Sparkles className="text-blue" size={28} />
                  <div className="absolute inset-0 rounded-2xl glow-blue opacity-50 pointer-events-none" />
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">AI Powered <span className="text-gradient">Builder</span></h1>
                <p className="text-muted-foreground flex items-center justify-center gap-2"><AiPulse color="teal" />Select what you want to create</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(({ value, label, icon: Icon, color, desc }) => (
                  <motion.button key={value} whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleSelect(value)} className="group bg-card rounded-xl border border-border p-5 text-left card-glow hover:border-blue/20 transition-all duration-300 relative overflow-hidden flex flex-col h-full">
                    <div className={`w-10 h-10 rounded-lg ${bgMap[color]} flex items-center justify-center mb-3 transition-all duration-300`}>
                      <Icon size={20} className={colorMap[color]} />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 mb-4 break-words">{desc}</p>
                    <span className={`mt-auto inline-flex items-center gap-1.5 text-xs font-semibold ${colorMap[color]} group-hover:gap-2.5 transition-all`}>
                      Build Now <ArrowLeft size={13} className="rotate-180" />
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {phase === "prompt" && (
            <motion.div key="prompt" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-2 mb-4">
                  {selectedCat && <selectedCat.icon size={22} className={colorMap[selectedCat.color]} />}
                  <span className={`text-xs font-medium tracking-wider uppercase ${colorMap[selectedCat?.color || "blue"]} bg-${selectedCat?.color || "blue"}/10 px-3 py-1 rounded-full`}>{selectedCat?.label}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">Describe Your <span className="text-gradient">Project</span></h2>
                <p className="text-muted-foreground text-sm flex items-center justify-center gap-2"><AiPulse color="purple" />Be detailed — the AI builds a real, complete deliverable</p>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" /><span>{error}</span>
                </div>
              )}

              {isVideo && (
                <div className="mb-4 bg-card rounded-2xl border border-border p-5 card-glow space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-2 block">Video Style</label>
                    <div className="flex flex-wrap gap-2">
                      {VIDEO_STYLES.map((s) => (
                        <button key={s} type="button" onClick={() => setVideoStyle(s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${videoStyle === s ? "bg-cyan/10 border-cyan/40 text-cyan" : "border-border text-muted-foreground hover:border-cyan/20"}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-2 block">Duration</label>
                      <div className="flex flex-wrap gap-2">
                        {VIDEO_DURATIONS.map((d) => (
                          <button key={d} type="button" onClick={() => setVideoDuration(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${videoDuration === d ? "bg-blue/10 border-blue/40 text-blue" : "border-border text-muted-foreground hover:border-blue/20"}`}>{d}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-2 block">Resolution</label>
                      <div className="flex flex-wrap gap-2">
                        {VIDEO_RESOLUTIONS.map((r) => (
                          <button key={r} type="button" onClick={() => setVideoResolution(r)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${videoResolution === r ? "bg-purple/10 border-purple/40 text-purple" : "border-border text-muted-foreground hover:border-purple/20"}`}>{r}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-card rounded-2xl border border-border p-6 card-glow relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue/20 to-transparent" />
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6}
                  placeholder={`Describe the ${selectedCat?.label.toLowerCase()} you want to build...`}
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none text-[15px] leading-relaxed" />

                {/* ── ATTACHMENTS ── */}
                <div className="mt-4 pt-4 border-t border-border">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  />

                  {/* Prominent Attach File button — visible on mobile + desktop */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-blue/30 bg-blue/[0.06] hover:bg-blue/10 hover:border-blue/50 text-blue font-medium text-sm transition-all shadow-[0_0_20px_-8px_hsl(var(--color-blue)/0.5)] hover:shadow-[0_0_28px_-6px_hsl(var(--color-blue)/0.7)]"
                  >
                    <Paperclip size={16} />
                    <span>Attach File</span>
                    <span className="text-[11px] text-muted-foreground font-normal hidden sm:inline">· for AI reference</span>
                  </button>
                  <p className="mt-2 text-[11px] text-muted-foreground">Attach files for AI reference — PNG, JPG, PDF, DOCX, TXT, MP4, MP3, ZIP</p>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault(); setDragOver(false);
                      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    className={`mt-3 relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 p-5 text-center overflow-hidden ${
                      dragOver
                        ? "border-blue/60 bg-blue/[0.06]"
                        : "border-border hover:border-blue/40 hover:bg-blue/[0.03]"
                    }`}
                  >
                    <div className="absolute inset-0 pointer-events-none opacity-50" style={{
                      background: "radial-gradient(circle at 50% 0%, hsl(var(--color-blue)/0.08), transparent 60%)"
                    }} />
                    <div className="relative flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-blue/10 flex items-center justify-center">
                        <UploadCloud size={18} className="text-blue" />
                      </div>
                      <p className="text-sm text-foreground font-medium">
                        Attach files for AI reference
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Drag &amp; drop or <span className="text-blue underline-offset-2">browse</span> · PNG, JPG, PDF, DOCX, TXT, MP4, MP3, ZIP
                      </p>
                      <p className="text-[10px] text-muted-foreground/70">
                        Up to {MAX_FILES} files · Max 20MB each
                      </p>
                    </div>
                  </div>

                  {attachments.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {attachments.map((a) => {
                        const Icon = iconForKind(a.kind);
                        return (
                          <li key={a.id} className="relative flex items-center gap-3 bg-card/60 border border-border rounded-lg p-2.5 pr-9 overflow-hidden">
                            <div className="shrink-0 w-10 h-10 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                              {a.previewUrl && a.kind === "image" ? (
                                <img src={a.previewUrl} alt={a.name} className="w-full h-full object-cover" />
                              ) : (
                                <Icon size={16} className="text-blue" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground truncate">{a.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {formatBytes(a.size)} · {a.kind}
                                {a.kind !== "image" && a.kind !== "text" && " · referenced as context"}
                              </p>
                              {a.progress < 100 && (
                                <div className="h-1 bg-muted rounded-full overflow-hidden mt-1.5">
                                  <div className="h-full bg-blue transition-all" style={{ width: `${a.progress}%` }} />
                                </div>
                              )}
                            </div>
                            {a.progress === 100 && (
                              <CheckCircle2 size={14} className="text-teal absolute right-9 top-1/2 -translate-y-1/2" />
                            )}
                            <button
                              type="button"
                              onClick={() => removeAttachment(a.id)}
                              aria-label={`Remove ${a.name}`}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                            >
                              <X size={14} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border mt-4 gap-3 flex-wrap">
                  <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Change category</button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleBuild} disabled={!prompt.trim() || uploading}
                    className="px-6 py-2.5 rounded-lg font-heading font-semibold text-sm flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed text-white hover-glow-blue transition-all duration-300"
                    style={{ background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple)))" }}>
                    <Send size={14} /> {uploading ? "Uploading..." : "Build with AI"}
                  </motion.button>
                </div>

              </div>

            </motion.div>
          )}

          {phase === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-lg mx-auto text-center">
              <div className="relative w-24 h-24 mx-auto mb-10">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-2 border-blue/20 border-t-blue pointer-events-none" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border-2 border-purple/20 border-b-purple pointer-events-none" />
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-4 rounded-full border-2 border-teal/20 border-t-teal pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--color-blue) / 0.3), hsl(var(--color-purple) / 0.3))" }}>
                    <Cpu size={16} className="text-blue" />
                  </motion.div>
                </div>
              </div>
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">AI is <span className="text-gradient">Building</span>...</h2>
              <p className="text-muted-foreground text-sm mb-8 flex items-center justify-center gap-2"><AiPulse color="blue" />Generating your {selectedCat?.label.toLowerCase()}</p>

              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden relative">
                <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, hsl(var(--color-blue)), hsl(var(--color-purple)), hsl(var(--color-cyan)))" }} initial={{ width: "0%" }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
              </div>
              <p className="text-xs text-muted-foreground mt-3 font-mono">{progress}%</p>

              <div className="mt-8 space-y-3 text-left max-w-sm mx-auto">
                {loadingSteps.map(({ label, icon: StepIcon, color }, i) => {
                  const active = progress > i * 25 && progress <= (i + 1) * 25;
                  const done = progress > (i + 1) * 25;
                  return (
                    <div key={label} className={`flex items-center gap-3 text-sm px-4 py-2.5 rounded-lg border transition-all ${active ? "bg-card border-blue/20 card-glow" : done ? "bg-card/50 border-border" : "border-transparent opacity-50"}`}>
                      {active ? <AiPulse color={color.replace("text-", "")} /> : done ? <CheckCircle2 size={14} className={color} /> : <StepIcon size={14} className="text-muted-foreground/30" />}
                      <span className={done ? "text-foreground" : active ? `${color} font-medium` : "text-muted-foreground/50"}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {phase === "result" && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.6 }} className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, hsl(var(--color-blue) / 0.15), hsl(var(--color-teal) / 0.15))" }}>
                  <CheckCircle2 size={30} className="text-teal" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">
                  Your {selectedCat?.label} is <span className="text-gradient-teal">Ready</span>
                </h2>
                <p className="text-muted-foreground text-sm max-w-lg mx-auto truncate">"{prompt}"</p>
              </div>

              {/* ── IMAGE RESULTS ── */}
              {isImage && images.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {images.map((url, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      className="bg-card rounded-2xl border border-border overflow-hidden card-glow group">
                      <div className="aspect-square bg-muted overflow-hidden">
                        <img src={url} alt={`${selectedCat?.label} variant ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Concept {String.fromCharCode(65 + i)}</span>
                        <button onClick={() => downloadImage(url, i)} className="p-2 rounded-md hover:bg-blue/10 text-muted-foreground hover:text-blue transition-colors" aria-label="Download">
                          <Download size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* ── STRUCTURED RESULTS ── */}
              {!isImage && result && (
                <div className="space-y-6">
                  {/* Title card */}
                  {(result.title || result.summary) && (
                    <div className="bg-card rounded-2xl border border-border p-6 card-glow">
                      {result.title && <h3 className="text-xl font-heading font-bold text-foreground mb-2">{result.title}</h3>}
                      {result.tagline && <p className="text-sm text-blue mb-3 font-medium">{result.tagline}</p>}
                      {result.summary && <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>}
                      {result.logline && <p className="text-sm text-muted-foreground leading-relaxed">{result.logline}</p>}
                      {result.brief && <p className="text-sm text-muted-foreground leading-relaxed">{result.brief}</p>}
                    </div>
                  )}

                  {/* Live preview */}
                  {result.previewHtml && (
                    <div className="bg-card rounded-2xl border border-border overflow-hidden card-glow">
                      <div className="flex items-center justify-between p-4 border-b border-border">
                        <div className="flex items-center gap-2">
                          <Monitor size={16} className="text-purple" />
                          <span className="text-sm font-heading font-semibold">Live Preview</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={downloadHtml} className="p-2 rounded-md hover:bg-blue/10 text-muted-foreground hover:text-blue transition-colors" aria-label="Download HTML"><Download size={14} /></button>
                          <button onClick={() => {
                            const w = window.open(); if (w) { w.document.write(result.previewHtml); w.document.close(); }
                          }} className="p-2 rounded-md hover:bg-blue/10 text-muted-foreground hover:text-blue transition-colors" aria-label="Open in new tab"><ExternalLink size={14} /></button>
                        </div>
                      </div>
                      <iframe srcDoc={result.previewHtml} title="AI Preview" className="w-full h-[600px] bg-white" sandbox="allow-scripts allow-same-origin" />
                    </div>
                  )}

                  {/* Structured details */}
                  <div className="grid md:grid-cols-2 gap-5">
                    {Object.entries(result).map(([key, val]) => {
                      if (["title", "tagline", "summary", "logline", "brief", "previewHtml"].includes(key)) return null;
                      if (val === null || val === undefined || val === "") return null;
                      return (
                        <div key={key} className="bg-card rounded-2xl border border-border p-5 card-glow">
                          <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">{key.replace(/([A-Z])/g, " $1").trim()}</h4>
                          <DetailRenderer value={val} />
                        </div>
                      );
                    })}
                  </div>

                  {/* JSON spec */}
                  <details className="bg-card rounded-2xl border border-border p-5 card-glow">
                    <summary className="text-sm font-heading font-semibold cursor-pointer flex items-center gap-2">
                      <Code2 size={14} className="text-teal" /> Full Specification (JSON)
                      <button onClick={(e) => { e.preventDefault(); copyJson(); }} className="ml-auto p-1.5 rounded hover:bg-teal/10 text-muted-foreground hover:text-teal"><Copy size={12} /></button>
                    </summary>
                    <pre className="mt-4 text-xs bg-muted/50 p-4 rounded-lg overflow-auto max-h-96 font-mono text-foreground">{JSON.stringify(result, null, 2)}</pre>
                  </details>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-foreground font-heading font-semibold text-sm card-glow hover:border-blue/20 transition-all">
                  <RotateCcw size={14} /> Build Something Else
                </motion.button>
                <motion.a href="#contact" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onBack}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-heading font-semibold text-sm hover-glow-blue transition-all"
                  style={{ background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple)))" }}>
                  <Sparkles size={14} /> Contact Us to Deploy
                </motion.a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} reason={accessStatus === "locked" ? "out_of_coins" : "upgrade"} />
    </div>
  );
};

const DetailRenderer = ({ value }: { value: any }) => {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
    if (typeof value[0] === "string") {
      return (
        <div className="flex flex-wrap gap-1.5">
          {value.map((s, i) => <span key={i} className="text-xs bg-blue/10 text-blue px-2.5 py-1 rounded-full">{s}</span>)}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="text-sm border-l-2 border-blue/30 pl-3">
            {typeof item === "object" ? Object.entries(item).map(([k, v]) => (
              <div key={k} className="text-xs"><span className="text-muted-foreground capitalize">{k}: </span><span className="text-foreground">{Array.isArray(v) ? v.join(", ") : String(v)}</span></div>
            )) : String(item)}
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === "object" && value !== null) {
    return (
      <div className="space-y-1.5 text-sm">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="text-xs">
            <span className="text-muted-foreground capitalize">{k}: </span>
            <span className="text-foreground">{Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  return <p className="text-sm text-foreground leading-relaxed">{String(value)}</p>;
};

export default AiBuilder;
