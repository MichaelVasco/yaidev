import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Sparkles, Send, Loader2, CheckCircle2,
  Globe, Smartphone, Monitor, Gamepad2, Bot, ImageIcon,
  Hexagon, Video, Music, PenTool, Wand2,
  FileCode, FolderTree, Database, Layout, Server, Palette,
  Download, Share2, Copy, RotateCcw, Crown, Coins
} from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import PaywallModal from "@/components/PaywallModal";

const categories = [
  { value: "websites", label: "Websites", icon: Globe },
  { value: "apps", label: "Apps", icon: Smartphone },
  { value: "softwares", label: "Softwares", icon: Monitor },
  { value: "games", label: "Games", icon: Gamepad2 },
  { value: "bots", label: "Bots", icon: Bot },
  { value: "images", label: "Create Images", icon: ImageIcon },
  { value: "logos", label: "Create Logos", icon: Hexagon },
  { value: "videos", label: "Create Videos", icon: Video },
  { value: "audios", label: "Create Audios", icon: Music },
  { value: "designs", label: "Create Designs", icon: PenTool },
  { value: "other", label: "Create Any Other Thing", icon: Wand2 },
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

const AiBuilder = ({ onBack }: { onBack: () => void }) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<"select" | "prompt" | "loading" | "result">("select");
  const [progress, setProgress] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  const {
    credits, vip, accessStatus, canUse, useCredit,
    pending, activateVip, submitPayment, grantAccess,
  } = useCredits();

  const selectedCat = categories.find((c) => c.value === category);
  const isDev = category && devCategories.includes(category);

  const handleSelect = (val: Category) => {
    setCategory(val);
    setPhase("prompt");
  };

  const handleBuild = () => {
    if (!prompt.trim()) return;
    if (!canUse) {
      setShowPaywall(true);
      return;
    }
    const ok = useCredit();
    if (!ok) {
      setShowPaywall(true);
      return;
    }
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
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-blue/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple/[0.03] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-teal/[0.02] blur-[80px]" />
      </div>
      {/* Header */}
      <div className="glass fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="h-5 w-px bg-border" />
            <span className="font-heading font-bold text-primary text-sm">YAIDEV</span>
            <span className="text-muted-foreground text-sm">/ AI Builder</span>
          </div>

          {/* Credits badge */}
          <button
            onClick={() => setShowPaywall(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary/30 transition-colors text-sm"
          >
            {vip ? (
              <>
                <Crown size={14} className="text-primary" />
                <span className="font-medium text-primary">VIP</span>
              </>
            ) : accessStatus === "subscribed" ? (
              <>
                <Sparkles size={14} className="text-primary" />
                <span className="font-medium text-primary">Pro</span>
              </>
            ) : (
              <>
                <Coins size={14} className={credits > 5 ? "text-primary" : "text-destructive"} />
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
          {/* ─── STEP 1: Category Select ─── */}
          {phase === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-12">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Sparkles className="text-primary" size={26} />
                </div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
                  AI Powered <span className="text-primary">Builder</span>
                </h1>
                <p className="text-muted-foreground">Select what you want to create</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map(({ value, label, icon: Icon }) => (
                  <motion.button
                    key={value}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelect(value)}
                    className="group bg-card rounded-xl border border-border p-5 text-left card-glow hover:border-blue/20 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <Icon size={20} className="text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── STEP 2: Prompt ─── */}
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
                  {selectedCat && <selectedCat.icon size={22} className="text-primary" />}
                  <span className="text-xs font-medium tracking-wider uppercase text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {selectedCat?.label}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">
                  Describe Your <span className="text-primary">Project</span>
                </h2>
                <p className="text-muted-foreground text-sm">
                  Be as detailed as possible for the best result.
                </p>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 card-glow relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue/20 to-transparent" />
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  placeholder={`Describe the ${selectedCat?.label.toLowerCase()} you want to build...`}
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none text-[15px] leading-relaxed"
                />
                <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
                  <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    ← Change category
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBuild}
                    disabled={!prompt.trim()}
                    className="px-6 py-2.5 rounded-lg font-heading font-semibold text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-white hover-glow-blue transition-all duration-300"
                    style={{ background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple)))" }}
                  >
                    <Send size={14} />
                    Build with AI
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 3: Loading ─── */}
          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-8"
              >
                <Loader2 size={64} className="text-primary" />
              </motion.div>
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                AI is Building...
              </h2>
              <p className="text-muted-foreground text-sm mb-8">
                Generating your {selectedCat?.label.toLowerCase()}
              </p>

              {/* Progress bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(var(--color-blue)), hsl(var(--color-purple)), hsl(var(--color-cyan)))" }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
              </div>
              <p className="text-xs text-muted-foreground mt-3">{progress}% complete</p>

              {/* Status steps */}
              <div className="mt-8 space-y-2 text-left max-w-xs mx-auto">
                {["Analyzing requirements", "Generating architecture", "Building components", "Finalizing output"].map((step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: progress > i * 25 ? 1 : 0.3, x: 0 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <CheckCircle2 size={14} className={progress > (i + 1) * 25 ? "text-primary" : "text-muted-foreground/40"} />
                    <span className={progress > (i + 1) * 25 ? "text-foreground" : "text-muted-foreground/60"}>{step}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── STEP 4: Result ─── */}
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
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 size={28} className="text-primary" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">
                  Your {selectedCat?.label} {isDev ? "Project" : ""} is Ready
                </h2>
                <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                  "{prompt.length > 80 ? prompt.slice(0, 80) + "..." : prompt}"
                </p>
              </div>

              {isDev ? (
                /* ─── Dev project output ─── */
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Project structure */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                      <FolderTree size={16} className="text-primary" /> Project Structure
                    </h3>
                    <div className="space-y-1 font-mono text-sm">
                      {(projectStructures[category!] || []).map((item, i) => (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <div className="flex items-center gap-2 text-foreground py-1">
                            <item.icon size={14} className="text-primary" />
                            <span>{item.name}</span>
                          </div>
                          {item.children?.map((child) => (
                            <div key={child} className="flex items-center gap-2 text-muted-foreground py-0.5 pl-6">
                              <FileCode size={12} />
                              <span>{child}</span>
                            </div>
                          ))}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Tech stack & preview */}
                  <div className="space-y-5">
                    <div className="bg-card rounded-2xl border border-border p-6">
                      <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Layout size={16} className="text-primary" /> Preview
                      </h3>
                      <div className="aspect-video rounded-lg bg-muted/50 border border-border flex items-center justify-center">
                        <div className="text-center">
                          <Monitor size={32} className="text-muted-foreground/40 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Live preview loading...</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-6">
                      <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Palette size={16} className="text-primary" /> Tech Stack
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {["React", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL"].map((t) => (
                          <span key={t} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ─── Media / creative output ─── */
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map((n) => (
                    <motion.div
                      key={n}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: n * 0.15 }}
                      className="bg-card rounded-2xl border border-border overflow-hidden group"
                    >
                      <div className="aspect-square bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 flex items-center justify-center relative">
                        <div className="text-center">
                          {selectedCat && <selectedCat.icon size={40} className="text-primary/30 mx-auto mb-2" />}
                          <p className="text-xs text-muted-foreground">{mediaLabels[category!]} #{n}</p>
                        </div>
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {mediaLabels[category!]} #{n}
                        </span>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Download size={14} />
                          </button>
                          <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Share2 size={14} />
                          </button>
                          <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Action bar */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-foreground font-heading font-semibold text-sm hover:border-primary/30 transition-colors"
                >
                  <RotateCcw size={14} />
                  Build Something Else
                </motion.button>
                <motion.a
                  href="#contact"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onBack}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm hover:bg-primary/90 transition-colors"
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
