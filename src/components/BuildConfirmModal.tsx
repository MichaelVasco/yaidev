import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Rocket, X, Sparkles } from "lucide-react";
import { BUILDER_CONFIRM_EVENT } from "@/lib/openBuilder";

interface Props {
  onConfirm: (prompt: string) => void;
}

/**
 * Global "Ready To Build?" popup. Listens for the BUILDER_CONFIRM_EVENT
 * dispatched by openAIBuilder() so every entry point (Enter key, Open AI
 * Builder button, Navbar CTA) opens the exact same flow.
 */
const BuildConfirmModal = ({ onConfirm }: Props) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ prompt?: string }>).detail || {};
      setPrompt(detail.prompt || "");
      setOpen(true);
    };
    window.addEventListener(BUILDER_CONFIRM_EVENT, handler as EventListener);
    return () => window.removeEventListener(BUILDER_CONFIRM_EVENT, handler as EventListener);
  }, []);

  const close = () => setOpen(false);
  const confirm = () => { setOpen(false); onConfirm(prompt); };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Enter") confirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, prompt]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-7 text-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="builder-confirm-title"
          >
            <button
              onClick={close}
              className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Rocket size={26} className="text-primary" />
            </div>

            <h2 id="builder-confirm-title" className="font-heading font-bold text-2xl text-foreground mb-2">
              Ready To Build?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Your AI Builder is ready. Choose <span className="font-semibold text-foreground">Build Now</span> to continue.
            </p>

            {prompt && (
              <div className="text-left rounded-lg bg-muted/50 border border-border px-3 py-2 mb-5 text-xs text-foreground/80 line-clamp-3 flex gap-2">
                <Sparkles size={12} className="text-primary flex-shrink-0 mt-0.5" />
                <span className="italic">"{prompt}"</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={close}
                className="py-2.5 rounded-lg text-sm font-semibold bg-muted text-foreground hover:bg-muted/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                autoFocus
                className="py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
              >
                <Rocket size={14} /> Build Now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BuildConfirmModal;
