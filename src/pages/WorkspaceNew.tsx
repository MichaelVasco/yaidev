import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Bot, Boxes, Brain, Gamepad2, Globe, Loader2, Mic, MicOff, Paperclip, Rocket,
  Smartphone, Sparkles, Trash2, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createSession, CATEGORY_LABEL, type Category } from "@/lib/workspace-api";
import { readPendingPrompt, clearPendingPrompt } from "@/lib/openBuilder";

const CATEGORIES: { value: Category; icon: any; example: string }[] = [
  { value: "websites", icon: Globe, example: "Build a modern e-commerce website for a fashion company." },
  { value: "apps", icon: Smartphone, example: "Build a food delivery mobile application." },
  { value: "software", icon: Boxes, example: "Build accounting software for small businesses." },
  { value: "games", icon: Gamepad2, example: "Build a 3D football game." },
  { value: "robots", icon: Rocket, example: "Build an intelligent home assistant robot." },
  { value: "agents", icon: Bot, example: "Build an AI customer-service agent that answers customer questions." },
  { value: "models", icon: Brain, example: "Build an AI model that classifies customer messages." },
];

export default function WorkspaceNew() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [category, setCategory] = useState<Category>((params.get("type") as Category) || "websites");
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<{ name: string; kind: string; content?: string }[]>([]);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const pending = readPendingPrompt();
    if (pending) { setPrompt(pending); clearPendingPrompt(); }
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate(`/auth?redirect=${encodeURIComponent("/workspace/new")}`);
  }, [user, loading, navigate]);

  const active = CATEGORIES.find((c) => c.value === category)!;

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return toast.error("Voice input isn't supported in this browser.");
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = false; rec.lang = "en-US";
    rec.onresult = (e: any) => {
      const text = Array.from(e.results).slice(e.resultIndex).map((r: any) => r[0].transcript).join(" ");
      setPrompt((p) => (p ? `${p} ${text}`.trim() : text.trim()));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  const addFiles = async (list: FileList) => {
    const next: typeof files = [];
    for (const f of Array.from(list).slice(0, 6)) {
      if (f.size > 2 * 1024 * 1024) { toast.error(`${f.name} is too large (max 2 MB)`); continue; }
      const isImage = f.type.startsWith("image/");
      const content = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        isImage ? r.readAsDataURL(f) : r.readAsText(f);
      });
      next.push({ name: f.name, kind: isImage ? "image" : "text", content });
    }
    setFiles((p) => [...p, ...next].slice(0, 6));
  };

  const create = async () => {
    if (!prompt.trim() || !user) return;
    setBusy(true);
    try {
      const id = await createSession(category, prompt, user.id, files.map((f) => ({ name: f.name, kind: f.kind })));
      navigate(`/workspace/${id}`);
    } catch (e: any) {
      toast.error(e.message || "Could not start the project");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-10 max-w-4xl">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-blue/10 text-blue mb-3">
            <Sparkles size={12} /> YAIDEV Universal Creation Workspace
          </span>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-foreground">What do you want to create?</h1>
          <p className="text-muted-foreground mt-2 text-sm">Describe it in your own words. YAIDEV plans, builds, tests and delivers it.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-5">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const on = c.value === category;
            return (
              <button key={c.value} onClick={() => setCategory(c.value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs transition ${on ? "border-blue bg-blue/10 text-blue" : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-blue/40"}`}>
                <Icon size={17} /> {CATEGORY_LABEL[c.value]}
              </button>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={7}
            placeholder={`Describe your ${CATEGORY_LABEL[category].toLowerCase()} in detail — features, audience, style, integrations. Example: "${active.example}"`}
            className="w-full bg-transparent resize-none outline-none text-sm sm:text-base text-foreground placeholder:text-muted-foreground/70"
          />

          {files.length > 0 && (
            <ul className="flex flex-wrap gap-1.5 my-2">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-muted/60 text-muted-foreground">
                  {f.name}
                  <button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}><X size={11} /></button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-border flex-wrap">
            <div className="flex items-center gap-1">
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground">
                <Paperclip size={13} /> Attach
              </button>
              <button onClick={toggleVoice}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs ${listening ? "border-destructive text-destructive" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {listening ? <MicOff size={13} /> : <Mic size={13} />} {listening ? "Stop" : "Voice"}
              </button>
              <button onClick={() => { setPrompt(""); setFiles([]); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-destructive">
                <Trash2 size={13} /> Clear
              </button>
              <input ref={fileRef} type="file" multiple className="hidden" accept="image/*,.txt,.md,.json,.csv,.js,.ts,.tsx,.py,.html,.css"
                onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
            </div>
            <button onClick={create} disabled={!prompt.trim() || busy}
              className="px-5 py-2.5 rounded-xl text-white font-heading font-semibold text-sm flex items-center gap-2 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple)))" }}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Create with YAIDEV
            </button>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Example prompts</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.value} onClick={() => { setCategory(c.value); setPrompt(c.example); }}
                className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-blue/40 transition">
                {c.example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
