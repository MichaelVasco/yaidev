import { useState, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Users, Bot, ArrowRight, Zap, Shield, Sparkles, Send, Loader2 } from "lucide-react";
import FloatingParticles from "@/components/FloatingParticles";

interface Props {
  onOpenAiBuilder: (prompt?: string) => void;
}

const BuildNowSection = ({ onOpenAiBuilder }: Props) => {
  const [prompt, setPrompt] = useState("");
  const launching = false;

  // Opens the "Ready To Build?" modal immediately.
  // Does NOT navigate or scroll — navigation happens only when the user
  // clicks "Build Now" inside the modal.
  const launch = (value: string) => {
    onOpenAiBuilder(value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter (without Shift) opens the confirm modal. Block ALL default and
    // bubbling behaviour so nothing else on the page can react (no form
    // submit, no anchor activation, no scroll-to-hash side effects).
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      const native = e.nativeEvent as Event & { stopImmediatePropagation?: () => void };
      native.stopImmediatePropagation?.();
      launch(prompt);
    }
  };

  return (
    <section
      id="build-now"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, hsl(214 40% 96%), hsl(210 40% 98%), hsl(214 40% 96%))",
      }}
    >
      <div className="absolute inset-0 tech-grid-bg opacity-40 pointer-events-none" />
      <FloatingParticles count={30} className="opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue/[0.05] blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 py-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-4 block"
          >
            Get Started
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-5">
            Build <span className="text-gradient">Now</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
            Choose your path — work with our expert team or harness the power of AI to build your next project.
          </p>
        </motion.div>

        {/* ── Homepage prompt box: Enter or button both call openAIBuilder(prompt) ── */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          onSubmit={(e) => {
            e.preventDefault();
            launch(prompt);
          }}
          className="max-w-3xl mx-auto mb-12"
        >
          <div className="relative bg-white rounded-2xl border border-border shadow-sm hover:shadow-lg hover:border-primary/25 transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="flex items-start gap-3 p-4 sm:p-5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles size={16} className="text-primary" />
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder="Describe what you want to build — press Enter to open the AI Builder…"
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none text-[15px] leading-relaxed min-h-[52px]"
                aria-label="Describe your project"
                disabled={launching}
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                disabled={launching}
                aria-label="Open AI Builder"
                className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 disabled:opacity-60 transition-all"
              >
                {launching ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </motion.button>
            </div>
            <div className="px-5 pb-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="hidden sm:inline">
                <kbd className="px-1.5 py-0.5 rounded bg-muted/60 border border-border font-mono text-[10px]">Enter</kbd> to launch
                {" · "}
                <kbd className="px-1.5 py-0.5 rounded bg-muted/60 border border-border font-mono text-[10px]">Shift + Enter</kbd> new line
              </span>
              <span className="ml-auto flex items-center gap-1 text-primary">
                <Zap size={11} /> Instant
              </span>
            </div>
          </div>
        </motion.form>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Human Experts */}
          <motion.a
            href="https://wa.me/2349047188353?text=Good%20Day%20Yaidev%2C%20I%20need%20a%20technology%20to%20be%20build%20by%20a%20human%20for%20me"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-white rounded-2xl border border-border p-10 flex flex-col text-center cursor-pointer pointer-events-auto touch-manipulation shadow-sm hover:shadow-lg hover:shadow-blue/8 hover:border-primary/20 transition-all duration-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/15 transition-colors duration-300">
                <Users size={28} className="text-primary" />
              </div>
              <h3 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-3 leading-snug">
                Let Our Human Experts Build For You
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Websites · Apps · Software · Games · Bots · Images · Logos · Videos · Audios · Designs · Any Other Thing
              </p>

              <div className="flex items-center justify-center gap-4 mb-6 text-muted-foreground text-xs">
                <span className="flex items-center gap-1"><Shield size={12} /> Custom Delivery</span>
                <span className="flex items-center gap-1"><Zap size={12} /> Expert Team</span>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                <span>Chat on WhatsApp</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </motion.a>

          {/* AI Build */}
          <motion.button
            onClick={() => launch(prompt)}
            disabled={launching}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-white rounded-2xl border border-border p-10 flex flex-col text-center cursor-pointer pointer-events-auto touch-manipulation shadow-sm hover:shadow-lg hover:shadow-blue/8 hover:border-primary/20 transition-all duration-500 overflow-hidden disabled:opacity-70"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/15 transition-colors duration-300">
                <Bot size={28} className="text-primary" />
              </div>
              <h3 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-3 leading-snug">
                Let AI Build For You
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Websites · Apps · Software · Games · Bots · Images · Logos · Videos · Audios · Designs · Any Other Thing
              </p>

              <div className="flex items-center justify-center gap-4 mb-6 text-muted-foreground text-xs">
                <span className="flex items-center gap-1"><Zap size={12} /> Instant</span>
                <span className="flex items-center gap-1"><Shield size={12} /> AI-Powered</span>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                {launching ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Opening…</span>
                  </>
                ) : (
                  <>
                    <span>Open AI Builder</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default BuildNowSection;
