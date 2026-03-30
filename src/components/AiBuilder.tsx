import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Sparkles, Send, CheckCircle2,
  Globe, Smartphone, Monitor, Gamepad2, Bot, ImageIcon,
  Hexagon, Video, Music, PenTool, Wand2,
  FileCode, FolderTree, Database, Layout, Server, Palette,
  Download, Share2, Copy, RotateCcw, Crown, Coins,
  Activity, Cpu, Zap, CircleDot
} from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import PaywallModal from "@/components/PaywallModal";
import FloatingParticles from "@/components/FloatingParticles";

const categories = [
  { value: "websites", label: "Websites", icon: Globe, color: "blue" },
  { value: "apps", label: "Apps", icon: Smartphone, color: "purple" },
  { value: "softwares", label: "Softwares", icon: Monitor, color: "teal" },
  { value: "games", label: "Games", icon: Gamepad2, color: "cyan" },
  { value: "bots", label: "Bots", icon: Bot, color: "blue" },
  { value: "images", label: "Create Images", icon: ImageIcon, color: "purple" },
  { value: "logos", label: "Create Logos", icon: Hexagon, color: "teal" },
  { value: "videos", label: "Create Videos", icon: Video, color: "cyan" },
  { value: "audios", label: "Create Audios", icon: Music, color: "blue" },
  { value: "designs", label: "Create Designs", icon: PenTool, color: "purple" },
  { value: "other", label: "Create Any Other Thing", icon: Wand2, color: "teal" },
];

type Category = (typeof categories)[number]["value"];

const devCategories = ["websites", "apps", "softwares", "games", "bots"];

const projectStructures: Record<string, { name: string; icon: typeof FileCode; children?: string[] }[]> = {
  websites: [
    { name: "src/", icon: FolderTree, children: ["index.html", "styles.css", "app.js", "components/"] },
    { name: "public/", icon: FolderTree, children: ["assets/", "favicon.ico"] },
    { name: "config/", icon: Database, children: ["webpack.config.js", "tailwind.config.js"] },
    { name: "package.json", icon: FileCode },
    { name: "README.md", icon: FileCode },
  ],
  apps: [
    { name: "src/", icon: FolderTree, children: ["screens/", "components/", "navigation/", "services/"] },
    { name: "assets/", icon: FolderTree, children: ["images/", "fonts/"] },
    { name: "App.tsx", icon: FileCode },
    { name: "app.json", icon: FileCode },
  ],
  softwares: [
    { name: "src/", icon: FolderTree, children: ["core/", "modules/", "utils/", "api/"] },
    { name: "database/", icon: Database, children: ["migrations/", "seeds/", "schema.sql"] },
    { name: "tests/", icon: FolderTree, children: ["unit/", "integration/"] },
    { name: "docker-compose.yml", icon: Server },
  ],
  games: [
    { name: "src/", icon: FolderTree, children: ["engine/", "scenes/", "entities/", "physics/"] },
    { name: "assets/", icon: FolderTree, children: ["sprites/", "audio/", "maps/"] },
    { name: "config/", icon: FileCode, children: ["game.config.js"] },
    { name: "main.ts", icon: FileCode },
  ],
  bots: [
    { name: "src/", icon: FolderTree, children: ["handlers/", "intents/", "models/", "middleware/"] },
    { name: "training/", icon: Database, children: ["data.json", "model.pkl"] },
    { name: "config/", icon: FileCode, children: ["bot.config.js", "prompts.yaml"] },
    { name: "index.ts", icon: FileCode },
  ],
};

const mediaLabels: Record<string, string> = {
  images: "Generated Image",
  logos: "Generated Logo",
  videos: "Generated Video",
  audios: "Generated Audio",
  designs: "Generated Design",
  other: "Generated Output",
};

/* Pulsing AI activity dot */
const AiPulse = ({ color = "blue" }: { color?: string }) => (
  <span className="relative flex h-2.5 w-2.5">
    <span
      className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${color}/60 opacity-75`}
    />
    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 bg-${color}`} />
  </span>
);

const colorMap: Record<string, string> = {
  blue: "text-blue",
  purple: "text-purple",
  teal: "text-teal",
  cyan: "text-cyan",
};
const bgMap: Record<string, string> = {
  blue: "bg-blue/10 group-hover:bg-blue/20",
  purple: "bg-purple/10 group-hover:bg-purple/20",
  teal: "bg-teal/10 group-hover:bg-teal/20",
  cyan: "bg-cyan/10 group-hover:bg-cyan/20",
};

const loadingSteps = [
  { label: "Analyzing requirements", icon: Activity, color: "text-blue" },
  { label: "Generating architecture", icon: Cpu, color: "text-purple" },
  { label: "Building components", icon: Zap, color: "text-teal" },
  { label: "Finalizing output", icon: CircleDot, color: "text-cyan" },
];

const AiBuilder = ({ onBack }: { onBack: () => void }) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<"select" | "prompt" | "loading" | "result">("select");
  const [progress, setProgress] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  const {
    credits, vip, accessStatus, canUse, useCredit,
    pending, activateVip, submitPayment,
  } = useCredits();

  const selectedCat = categories.find((c) => c.value === category);
  const isDev = category && devCategories.includes(category);

  const handleSelect = (val: Category) => {
    setCategory(val);
    setPhase("prompt");
  };

  const handleBuild = () => {
    if (!prompt.trim()) return;
    if (!canUse) { setShowPaywall(true); return; }
    const ok = useCredit();
    if (!ok) { setShowPaywall(true); return; }
    setPhase("loading");
    setProgress(0);
    const steps = [10, 25, 40, 55, 70, 85, 95, 100];
    steps.forEach((s, i) => setTimeout(() => setProgress(s), (i + 1) * 400));
    setTimeout(() => setPhase("result"), steps.length * 400 + 500);
  };

  const handleReset = () => {
    setPhase("select");
    setCategory(null);
    setPrompt("");
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-blue/[0.04] blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple/[0.04] blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-teal/[0.03] blur-[80px]"
        />
      </div>
      <FloatingParticles count={35} className="opacity-30 fixed" />

      {/* ─── Header ─── */}
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

          <button
            onClick={() => setShowPaywall(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card card-glow hover:border-blue/20 transition-all text-sm"
          >
            {vip ? (
              <>
                <Crown size={14} className="text-blue" />
                <span className="font-medium text-blue">VIP</span>
              </>
            ) : accessStatus === "subscribed" ? (
              <>
                <Sparkles size={14} className="text-purple" />
                <span className="font-medium text-purple">Pro</span>
              </>
            ) : (
              <>
                <Coins size={14} className={credits > 5 ? "text-blue" : "text-destructive"} />
                <span className={`font-medium ${credits > 5 ? "text-foreground" : "text-destructive"}`}>
                  {credits} credits
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="pt-28 pb-20 container mx-auto px-4">
        <AnimatePresence mode="wait">

          {/* ═══ STEP 1: Category Select ═══ */}
          {phase === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-12">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 relative"
                  style={{ background: "linear-gradient(135deg, hsl(var(--color-blue) / 0.15), hsl(var(--color-purple) / 0.15))" }}
                >
                  <Sparkles className="text-blue" size={28} />
                  <div className="absolute inset-0 rounded-2xl glow-blue opacity-50" />
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
                  AI Powered <span className="text-gradient">Builder</span>
                </h1>
                <p className="text-muted-foreground flex items-center justify-center gap-2">
                  <AiPulse color="teal" />
                  Select what you want to create
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map(({ value, label, icon: Icon, color }) => (
                  <motion.button
                    key={value}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelect(value)}
                    className="group bg-card rounded-xl border border-border p-5 text-left card-glow hover:border-blue/20 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-${color}/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className={`w-10 h-10 rounded-lg ${bgMap[color]} flex items-center justify-center mb-3 transition-all duration-300`}>
                      <Icon size={20} className={`${colorMap[color]} transition-colors duration-300`} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 2: Prompt ═══ */}
          {phase === "prompt" && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-2 mb-4">
                  {selectedCat && <selectedCat.icon size={22} className={colorMap[selectedCat.color]} />}
                  <span
                    className={`text-xs font-medium tracking-wider uppercase ${colorMap[selectedCat?.color || "blue"]} bg-${selectedCat?.color || "blue"}/10 px-3 py-1 rounded-full`}
                  >
                    {selectedCat?.label}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">
                  Describe Your <span className="text-gradient">Project</span>
                </h2>
                <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
                  <AiPulse color="purple" />
                  Be as detailed as possible for the best result
                </p>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 card-glow relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple/15 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  placeholder={`Describe the ${selectedCat?.label.toLowerCase()} you want to build...`}
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none text-[15px] leading-relaxed"
                />
                <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
                  <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    ← Change category
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBuild}
                    disabled={!prompt.trim()}
                    className="px-6 py-2.5 rounded-lg font-heading font-semibold text-sm flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed text-white hover-glow-blue transition-all duration-300"
                    style={{ background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple)))" }}
                  >
                    <Send size={14} />
                    Build with AI
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 3: Loading ═══ */}
          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto text-center"
            >
              {/* Animated AI core */}
              <div className="relative w-24 h-24 mx-auto mb-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-blue/20 border-t-blue"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 rounded-full border-2 border-purple/20 border-b-purple"
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 rounded-full border-2 border-teal/20 border-t-teal"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, hsl(var(--color-blue) / 0.3), hsl(var(--color-purple) / 0.3))" }}
                  >
                    <Cpu size={16} className="text-blue" />
                  </motion.div>
                </div>
                <div className="absolute inset-0 rounded-full glow-blue opacity-30" />
              </div>

              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                AI is <span className="text-gradient">Building</span>...
              </h2>
              <p className="text-muted-foreground text-sm mb-8 flex items-center justify-center gap-2">
                <AiPulse color="blue" />
                Generating your {selectedCat?.label.toLowerCase()}
              </p>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full relative"
                  style={{ background: "linear-gradient(90deg, hsl(var(--color-blue)), hsl(var(--color-purple)), hsl(var(--color-cyan)))" }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
                {/* Shimmer overlay */}
                <div className="absolute inset-0 animate-shimmer rounded-full" />
              </div>
              <p className="text-xs text-muted-foreground mt-3 font-mono">{progress}%</p>

              {/* Status steps */}
              <div className="mt-8 space-y-3 text-left max-w-sm mx-auto">
                {loadingSteps.map(({ label, icon: StepIcon, color }, i) => {
                  const active = progress > i * 25 && progress <= (i + 1) * 25;
                  const done = progress > (i + 1) * 25;
                  return (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: progress > i * 25 ? 1 : 0.25, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-3 text-sm px-4 py-2.5 rounded-lg border transition-all duration-500 ${
                        active ? "bg-card border-blue/20 card-glow" : done ? "bg-card/50 border-border" : "border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {active ? (
                          <AiPulse color={color.replace("text-", "")} />
                        ) : done ? (
                          <CheckCircle2 size={14} className={color} />
                        ) : (
                          <StepIcon size={14} className="text-muted-foreground/30" />
                        )}
                      </div>
                      <span className={done ? "text-foreground" : active ? `${color} font-medium` : "text-muted-foreground/50"}>
                        {label}
                      </span>
                      {active && (
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="ml-auto text-[10px] text-muted-foreground font-mono"
                        >
                          running...
                        </motion.span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 4: Result ═══ */}
          {phase === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              {/* Success header */}
              <div className="text-center mb-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative"
                  style={{ background: "linear-gradient(135deg, hsl(var(--color-blue) / 0.15), hsl(var(--color-teal) / 0.15))" }}
                >
                  <CheckCircle2 size={30} className="text-teal" />
                  <div className="absolute inset-0 rounded-full glow-teal opacity-40" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">
                  Your {selectedCat?.label} {isDev ? "Project" : ""} is <span className="text-gradient-teal">Ready</span>
                </h2>
                <p className="text-muted-foreground text-sm max-w-lg mx-auto flex items-center justify-center gap-2">
                  <AiPulse color="teal" />
                  "{prompt.length > 80 ? prompt.slice(0, 80) + "..." : prompt}"
                </p>
              </div>

              {isDev ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Project structure panel */}
                  <div className="bg-card rounded-2xl border border-border p-6 card-glow relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue/25 to-transparent" />
                    <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                      <FolderTree size={16} className="text-blue" /> Project Structure
                    </h3>
                    <div className="space-y-1 font-mono text-sm">
                      {(projectStructures[category!] || []).map((item, i) => (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                        >
                          <div className="flex items-center gap-2 text-foreground py-1 hover:bg-blue/5 px-2 rounded transition-colors">
                            <item.icon size={14} className="text-blue" />
                            <span>{item.name}</span>
                          </div>
                          {item.children?.map((child) => (
                            <div key={child} className="flex items-center gap-2 text-muted-foreground py-0.5 pl-8 hover:bg-purple/5 px-2 rounded transition-colors">
                              <FileCode size={12} className="text-purple/60" />
                              <span>{child}</span>
                            </div>
                          ))}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Preview panel */}
                    <div className="bg-card rounded-2xl border border-border p-6 card-glow relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple/25 to-transparent" />
                      <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Layout size={16} className="text-purple" /> Preview
                      </h3>
                      <div className="aspect-video rounded-lg border border-border flex items-center justify-center relative overflow-hidden"
                        style={{ background: "linear-gradient(135deg, hsl(var(--color-blue) / 0.05), hsl(var(--color-purple) / 0.05), hsl(var(--color-teal) / 0.05))" }}
                      >
                        <div className="text-center">
                          <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            <Monitor size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                          </motion.div>
                          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                            <AiPulse color="purple" /> Live preview loading...
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tech stack panel */}
                    <div className="bg-card rounded-2xl border border-border p-6 card-glow relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal/25 to-transparent" />
                      <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Palette size={16} className="text-teal" /> Tech Stack
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: "React", color: "blue" },
                          { name: "TypeScript", color: "blue" },
                          { name: "Tailwind CSS", color: "teal" },
                          { name: "Node.js", color: "teal" },
                          { name: "PostgreSQL", color: "purple" },
                        ].map(({ name, color }) => (
                          <span key={name} className={`text-xs bg-${color}/10 text-${color} px-3 py-1.5 rounded-full font-medium border border-${color}/10`}>
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map((n) => {
                    const colors = ["blue", "purple", "teal"];
                    const c = colors[n - 1];
                    return (
                      <motion.div
                        key={n}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: n * 0.15 }}
                        className="bg-card rounded-2xl border border-border overflow-hidden group card-glow relative"
                      >
                        <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-${c}/25 to-transparent`} />
                        <div
                          className="aspect-square flex items-center justify-center relative"
                          style={{ background: `linear-gradient(135deg, hsl(var(--color-${c}) / 0.06), hsl(var(--color-${colors[(n) % 3]}) / 0.04))` }}
                        >
                          <div className="text-center">
                            {selectedCat && <selectedCat.icon size={40} className={`text-${c}/30 mx-auto mb-2`} />}
                            <p className="text-xs text-muted-foreground">{mediaLabels[category!]} #{n}</p>
                          </div>
                          <div className={`absolute inset-0 bg-${c}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                        </div>
                        <div className="p-4 flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {mediaLabels[category!]} #{n}
                          </span>
                          <div className="flex items-center gap-1">
                            {[Download, Share2, Copy].map((BtnIcon, bi) => (
                              <button key={bi} className={`p-1.5 rounded-md hover:bg-${c}/10 transition-colors text-muted-foreground hover:text-${c}`}>
                                <BtnIcon size={14} />
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Action bar */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-foreground font-heading font-semibold text-sm card-glow hover:border-blue/20 transition-all"
                >
                  <RotateCcw size={14} />
                  Build Something Else
                </motion.button>
                <motion.a
                  href="#contact"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onBack}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-heading font-semibold text-sm hover-glow-blue transition-all"
                  style={{ background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple)))" }}
                >
                  <Sparkles size={14} />
                  Contact Us to Deploy
                </motion.a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        accessStatus={accessStatus}
        credits={credits}
        pending={pending}
        onActivateVip={activateVip}
        onSubmitPayment={submitPayment}
      />
    </div>
  );
};

export default AiBuilder;
