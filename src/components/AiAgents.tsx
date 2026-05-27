import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Bot, Send, Trash2, Rocket, Upload, Sparkles,
  Briefcase, Headphones, Megaphone, Code2, TrendingUp, LineChart,
  Share2, PenLine, Mic, User, CheckCircle2, Activity, X, Power
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE = "yaidev_ai_agents";

const AGENT_TYPES = [
  { value: "business", label: "Business Agent", icon: Briefcase },
  { value: "support", label: "Customer Support", icon: Headphones },
  { value: "marketing", label: "Marketing Agent", icon: Megaphone },
  { value: "coding", label: "Coding Agent", icon: Code2 },
  { value: "sales", label: "Sales Agent", icon: TrendingUp },
  { value: "trading", label: "Trading Agent", icon: LineChart },
  { value: "social", label: "Social Media", icon: Share2 },
  { value: "writer", label: "Content Writer", icon: PenLine },
  { value: "voice", label: "Voice Assistant", icon: Mic },
  { value: "personal", label: "Personal Assistant", icon: User },
] as const;

const PERSONALITIES = [
  "Professional & Concise", "Friendly & Conversational", "Witty & Creative",
  "Analytical & Precise", "Empathetic & Supportive", "Bold & Assertive",
];

type Agent = {
  id: string;
  name: string;
  type: string;
  avatar?: string;
  personality: string;
  purpose: string;
  instructions: string;
  trainingPrompts: string[];
  createdAt: string;
  status: "active" | "idle";
};

type Msg = { role: "user" | "assistant"; content: string };

const loadAgents = (): Agent[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE) || "[]"); } catch { return []; }
};
const saveAgents = (a: Agent[]) => localStorage.setItem(STORAGE, JSON.stringify(a));

const buildSystemPrompt = (a: Agent) =>
  `You are "${a.name}", a ${AGENT_TYPES.find(t => t.value === a.type)?.label || "AI"}.
Personality: ${a.personality}.
Business purpose: ${a.purpose}.
Custom instructions: ${a.instructions}.
Training context:
${a.trainingPrompts.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Always stay in character. Be helpful, accurate, and act according to your purpose.`;

const AiAgents = ({ onBack }: { onBack: () => void }) => {
  const [agents, setAgents] = useState<Agent[]>(loadAgents);
  const [view, setView] = useState<"dashboard" | "create" | "chat">("dashboard");
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);

  // create form
  const [form, setForm] = useState({
    name: "", type: "business", avatar: "", personality: PERSONALITIES[0],
    purpose: "", instructions: "", training: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  // chat
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  const onAvatar = (f: File) => {
    if (f.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, avatar: String(reader.result) }));
    reader.readAsDataURL(f);
  };

  const resetForm = () => setForm({
    name: "", type: "business", avatar: "", personality: PERSONALITIES[0],
    purpose: "", instructions: "", training: "",
  });

  const saveAgent = () => {
    if (!form.name.trim()) { toast.error("Agent needs a name"); return; }
    if (!form.purpose.trim()) { toast.error("Describe the agent's purpose"); return; }
    const agent: Agent = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      type: form.type,
      avatar: form.avatar,
      personality: form.personality,
      purpose: form.purpose.trim(),
      instructions: form.instructions.trim(),
      trainingPrompts: form.training.split("\n").map((s) => s.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      status: "active",
    };
    const next = [agent, ...agents];
    setAgents(next); saveAgents(next);
    toast.success(`Agent "${agent.name}" created`);
    resetForm();
    setActiveAgent(agent);
    setMessages([]);
    setView("chat");
  };

  const launchAgent = (a: Agent) => {
    setActiveAgent(a); setMessages([]); setView("chat");
  };

  const deleteAgent = (id: string) => {
    const next = agents.filter((a) => a.id !== id);
    setAgents(next); saveAgents(next);
    toast.success("Agent removed");
  };

  const toggleStatus = (id: string) => {
    const next = agents.map((a) => a.id === id ? { ...a, status: a.status === "active" ? "idle" as const : "active" as const } : a);
    setAgents(next); saveAgents(next);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeAgent || thinking) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next); setInput(""); setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { systemPrompt: buildSystemPrompt(activeAgent), messages: next },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      setMessages([...next, { role: "assistant", content: (data as any).reply || "..." }]);
    } catch (e: any) {
      toast.error(e?.message || "Agent failed to respond");
      setMessages(next);
    } finally {
      setThinking(false);
    }
  };

  const TypeIcon = ({ type, size = 18, className = "" }: { type: string; size?: number; className?: string }) => {
    const T = AGENT_TYPES.find((t) => t.value === type)?.icon || Bot;
    return <T size={size} className={className} />;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-blue/[0.04] blur-[120px]" />
        <motion.div animate={{ x: [0, -25, 0], y: [0, 15, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple/[0.04] blur-[100px]" />
      </div>

      <div className="glass fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={view === "dashboard" ? onBack : () => setView("dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="h-5 w-px bg-border" />
            <span className="font-heading font-bold text-sm text-gradient">YAIDEV</span>
            <span className="text-muted-foreground text-sm">/ AI Agents</span>
          </div>
          {view === "dashboard" && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setView("create")}
              className="px-4 py-2 rounded-lg text-white font-heading font-semibold text-sm flex items-center gap-2 hover-glow-blue"
              style={{ background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple)))" }}>
              <Plus size={14} /> Create AI Agent
            </motion.button>
          )}
        </div>
      </div>

      <div className="pt-24 pb-20 container mx-auto px-4">
        <AnimatePresence mode="wait">
          {view === "dashboard" && (
            <motion.div key="dash" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity }} className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 relative" style={{ background: "linear-gradient(135deg, hsl(var(--color-blue) / 0.15), hsl(var(--color-purple) / 0.15))" }}>
                  <Bot className="text-blue" size={28} />
                  <div className="absolute inset-0 rounded-2xl glow-blue opacity-50" />
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">AI <span className="text-gradient">Agents</span></h1>
                <p className="text-muted-foreground">Create, train, and launch your personal AI agents</p>
              </div>

              {agents.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-12 text-center card-glow">
                  <Bot size={42} className="mx-auto text-blue/40 mb-4" />
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2">No agents yet</h3>
                  <p className="text-sm text-muted-foreground mb-6">Build your first AI agent in under a minute.</p>
                  <button onClick={() => setView("create")} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold text-sm hover-glow-blue" style={{ background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple)))" }}>
                    <Plus size={14} /> Create Agent
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agents.map((a) => (
                    <motion.div key={a.id} layout whileHover={{ y: -4 }} className="bg-card border border-border rounded-2xl p-5 card-glow relative overflow-hidden group">
                      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-blue/5 blur-2xl group-hover:bg-blue/10 transition-all" />
                      <div className="flex items-start gap-3 mb-4 relative">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue/20 to-purple/20 flex items-center justify-center overflow-hidden shrink-0">
                          {a.avatar ? <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" /> : <TypeIcon type={a.type} className="text-blue" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-semibold text-foreground truncate">{a.name}</h3>
                          <p className="text-xs text-muted-foreground">{AGENT_TYPES.find(t => t.value === a.type)?.label}</p>
                        </div>
                        <button onClick={() => toggleStatus(a.id)} className="shrink-0" aria-label="Toggle status">
                          <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${a.status === "active" ? "bg-teal/15 text-teal" : "bg-muted text-muted-foreground"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${a.status === "active" ? "bg-teal animate-pulse" : "bg-muted-foreground"}`} />
                            {a.status}
                          </span>
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-[2rem]">{a.purpose}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => launchAgent(a)} className="flex-1 px-3 py-2 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover-glow-blue" style={{ background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple)))" }}>
                          <Rocket size={12} /> Launch
                        </button>
                        <button onClick={() => deleteAgent(a.id)} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors" aria-label="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === "create" && (
            <motion.div key="create" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">Create <span className="text-gradient">AI Agent</span></h2>
                <p className="text-sm text-muted-foreground">Define personality, purpose, and training</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 card-glow space-y-5">
                {/* Avatar + name */}
                <div className="flex items-center gap-4">
                  <button onClick={() => fileRef.current?.click()} className="w-20 h-20 rounded-2xl border-2 border-dashed border-border hover:border-blue/40 flex items-center justify-center overflow-hidden bg-muted/30 transition-colors shrink-0" aria-label="Upload avatar">
                    {form.avatar ? <img src={form.avatar} alt="avatar" className="w-full h-full object-cover" /> : <Upload size={20} className="text-muted-foreground" />}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onAvatar(e.target.files[0])} />
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Agent Name</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Nova" className="w-full mt-1 bg-transparent border-b border-border focus:border-blue outline-none py-2 text-foreground text-lg font-semibold" />
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Agent Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {AGENT_TYPES.map((t) => (
                      <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${form.type === t.value ? "border-blue/40 bg-blue/10 text-blue" : "border-border text-muted-foreground hover:border-blue/20"}`}>
                        <t.icon size={14} /> {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personality */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Personality</label>
                  <select value={form.personality} onChange={(e) => setForm({ ...form, personality: e.target.value })} className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:border-blue focus:outline-none">
                    {PERSONALITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Purpose */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Business Purpose</label>
                  <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="What this agent does, who it serves..." className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:border-blue focus:outline-none" />
                </div>

                {/* Instructions */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Custom Instructions</label>
                  <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={3} placeholder="Tone, rules, boundaries, response style..." className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:border-blue focus:outline-none resize-none" />
                </div>

                {/* Training */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Training Prompts (one per line)</label>
                  <textarea value={form.training} onChange={(e) => setForm({ ...form, training: e.target.value })} rows={4} placeholder="Example questions, knowledge facts, sample responses..." className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:border-blue focus:outline-none resize-none font-mono" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <button onClick={() => { resetForm(); setView("dashboard"); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={saveAgent}
                    className="px-6 py-2.5 rounded-lg text-white font-heading font-semibold text-sm flex items-center gap-2 hover-glow-blue"
                    style={{ background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple)))" }}>
                    <Sparkles size={14} /> Save & Launch
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {view === "chat" && activeAgent && (
            <motion.div key="chat" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="max-w-3xl mx-auto">
              <div className="bg-card border border-border rounded-2xl card-glow overflow-hidden flex flex-col h-[calc(100vh-180px)]">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center gap-3 bg-gradient-to-r from-blue/5 to-purple/5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue/20 to-purple/20 flex items-center justify-center overflow-hidden shrink-0">
                    {activeAgent.avatar ? <img src={activeAgent.avatar} alt={activeAgent.name} className="w-full h-full object-cover" /> : <TypeIcon type={activeAgent.type} className="text-blue" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-semibold text-foreground truncate">{activeAgent.name}</h3>
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal/15 text-teal">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" /> live
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{activeAgent.personality} • {AGENT_TYPES.find(t => t.value === activeAgent.type)?.label}</p>
                  </div>
                  <button onClick={() => setView("dashboard")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground" aria-label="Close chat"><X size={16} /></button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <Sparkles className="mx-auto text-blue/40 mb-3" size={28} />
                      <p className="text-sm text-muted-foreground">Say hi to <span className="text-foreground font-medium">{activeAgent.name}</span></p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${m.role === "user" ? "bg-gradient-to-br from-blue to-purple text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>
                    </motion.div>
                  ))}
                  {thinking && (
                    <div className="flex justify-start">
                      <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                        <Activity size={12} className="text-blue animate-pulse" />
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-purple animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-teal animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEnd} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-border bg-card">
                  <div className="flex items-end gap-2">
                    <textarea value={input} onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      rows={1} placeholder={`Message ${activeAgent.name}...`}
                      className="flex-1 bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:border-blue focus:outline-none resize-none max-h-32" />
                    <button onClick={sendMessage} disabled={!input.trim() || thinking}
                      className="p-3 rounded-xl text-white disabled:opacity-30 hover-glow-blue"
                      style={{ background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple)))" }} aria-label="Send">
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AiAgents;
