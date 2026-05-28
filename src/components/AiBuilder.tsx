import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Sparkles, Send, CheckCircle2,
  Globe, Smartphone, Monitor, Gamepad2, Bot, ImageIcon,
  Hexagon, Video, Music, PenTool, Wand2, BrainCircuit,
  Download, Copy, RotateCcw, Crown, Coins,
  Activity, Cpu, Zap, CircleDot, AlertCircle, Code2, ExternalLink,
  Paperclip, UploadCloud, X, FileText, FileArchive, FileAudio, FileVideo, File as FileIcon
} from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import PaywallModal from "@/components/PaywallModal";
import FloatingParticles from "@/components/FloatingParticles";
import AiAgents from "@/components/AiAgents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  { value: "websites", label: "Websites", icon: Globe, color: "blue" },
  { value: "apps", label: "Apps", icon: Smartphone, color: "purple" },
  { value: "softwares", label: "Softwares", icon: Monitor, color: "teal" },
  { value: "games", label: "Games", icon: Gamepad2, color: "cyan" },
  { value: "bots", label: "Bots", icon: Bot, color: "blue" },
  { value: "agents", label: "AI Agents", icon: BrainCircuit, color: "purple" },
  { value: "images", label: "Create Images", icon: ImageIcon, color: "purple" },
  { value: "logos", label: "Create Logos", icon: Hexagon, color: "teal" },
  { value: "videos", label: "Create Videos", icon: Video, color: "cyan" },
  { value: "audios", label: "Create Audios", icon: Music, color: "blue" },
  { value: "designs", label: "Create Designs", icon: PenTool, color: "purple" },
  { value: "other", label: "Create Any Other Thing", icon: Wand2, color: "teal" },
] as const;

type Category = (typeof categories)[number]["value"];
const imageCategories: Category[] = ["images", "logos", "designs"];

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

const AiBuilder = ({ onBack }: { onBack: () => void }) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<"select" | "prompt" | "loading" | "result">("select");
  const [progress, setProgress] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAgents, setShowAgents] = useState(false);
  const [videoStyle, setVideoStyle] = useState(VIDEO_STYLES[0]);
  const [videoDuration, setVideoDuration] = useState(VIDEO_DURATIONS[1]);
  const [videoResolution, setVideoResolution] = useState(VIDEO_RESOLUTIONS[1]);

  const { credits, vip, accessStatus, canUse, useCredit, pending, activateVip, submitPayment } = useCredits();

  const selectedCat = categories.find((c) => c.value === category);
  const isImage = category && imageCategories.includes(category);
  const isVideo = category === "videos";

  const handleSelect = (val: Category) => {
    if (val === "agents") { setShowAgents(true); return; }
    setCategory(val); setPhase("prompt");
  };

  if (showAgents) return <AiAgents onBack={() => setShowAgents(false)} />;


  const handleBuild = async () => {
    if (!prompt.trim() || !category) return;
    if (!canUse) { setShowPaywall(true); return; }
    if (!useCredit()) { setShowPaywall(true); return; }

    setPhase("loading");
    setProgress(5);
    setError(null);
    setResult(null);
    setImages([]);

    // Smooth progress while AI works
    const tick = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.max(1, Math.round((92 - p) / 12)) : p));
    }, 600);

    try {
      if (isImage) {
        const { data, error } = await supabase.functions.invoke("ai-image", {
          body: { category, prompt, variants: 3 },
        });
        if (error) throw new Error(error.message || "Image generation failed");
        if ((data as any)?.error) throw new Error((data as any).error);
        setImages((data as any).images || []);
      } else {
        const fullPrompt = isVideo
          ? `${prompt}\n\nProduction specs:\n- Style: ${videoStyle}\n- Duration: ${videoDuration}\n- Resolution: ${videoResolution}`
          : prompt;
        const { data, error } = await supabase.functions.invoke("ai-generate", {
          body: { category, prompt: fullPrompt },
        });

        if (error) throw new Error(error.message || "AI generation failed");
        if ((data as any)?.error) throw new Error((data as any).error);
        setResult((data as any).result);
      }
      setProgress(100);
      setTimeout(() => setPhase("result"), 350);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Something went wrong. Please try again.");
      toast.error(e?.message || "Generation failed");
      setPhase("prompt");
    } finally {
      clearInterval(tick);
    }
  };

  const handleReset = () => {
    setPhase("select"); setCategory(null); setPrompt("");
    setProgress(0); setResult(null); setImages([]); setError(null);
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
            {vip ? (<><Crown size={14} className="text-blue" /><span className="font-medium text-blue">VIP</span></>)
              : accessStatus === "subscribed" ? (<><Sparkles size={14} className="text-purple" /><span className="font-medium text-purple">Pro</span></>)
              : (<><Coins size={14} className={credits > 5 ? "text-blue" : "text-destructive"} /><span className={`font-medium ${credits > 5 ? "text-foreground" : "text-destructive"}`}>{credits} credits</span></>)}
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
                  <div className="absolute inset-0 rounded-2xl glow-blue opacity-50" />
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">AI Powered <span className="text-gradient">Builder</span></h1>
                <p className="text-muted-foreground flex items-center justify-center gap-2"><AiPulse color="teal" />Select what you want to create</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map(({ value, label, icon: Icon, color }) => (
                  <motion.button key={value} whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleSelect(value)} className="group bg-card rounded-xl border border-border p-5 text-left card-glow hover:border-blue/20 transition-all duration-300 relative overflow-hidden">
                    <div className={`w-10 h-10 rounded-lg ${bgMap[color]} flex items-center justify-center mb-3 transition-all duration-300`}>
                      <Icon size={20} className={colorMap[color]} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{label}</span>
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

                <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
                  <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Change category</button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleBuild} disabled={!prompt.trim()}
                    className="px-6 py-2.5 rounded-lg font-heading font-semibold text-sm flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed text-white hover-glow-blue transition-all duration-300"
                    style={{ background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple)))" }}>
                    <Send size={14} /> Build with AI
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {phase === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-lg mx-auto text-center">
              <div className="relative w-24 h-24 mx-auto mb-10">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-2 border-blue/20 border-t-blue" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border-2 border-purple/20 border-b-purple" />
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-4 rounded-full border-2 border-teal/20 border-t-teal" />
                <div className="absolute inset-0 flex items-center justify-center">
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

      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} accessStatus={accessStatus} credits={credits} pending={pending} onActivateVip={activateVip} onSubmitPayment={submitPayment} />
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
