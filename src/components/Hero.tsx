import { useState } from "react";
import { motion } from "framer-motion";
import {
  Monitor, Smartphone, Code2, Gamepad2, Bot, Palette,
  Laptop, BrainCircuit, Globe, Cpu, Terminal, Layers, ChevronDown
} from "lucide-react";

const floatingIcons = [
  { Icon: Laptop, x: -180, y: -120, delay: 0 },
  { Icon: Smartphone, x: 190, y: -105, delay: 0.3 },
  { Icon: Code2, x: -230, y: 35, delay: 0.6 },
  { Icon: Gamepad2, x: 210, y: 55, delay: 0.9 },
  { Icon: Bot, x: -145, y: 145, delay: 1.2 },
  { Icon: Palette, x: 165, y: 145, delay: 0.4 },
  { Icon: Monitor, x: -65, y: -165, delay: 0.7 },
  { Icon: BrainCircuit, x: 85, y: -155, delay: 1.0 },
  { Icon: Globe, x: -260, y: -25, delay: 0.2 },
  { Icon: Cpu, x: 260, y: -15, delay: 0.5 },
  { Icon: Terminal, x: -105, y: 185, delay: 0.8 },
  { Icon: Layers, x: 105, y: 185, delay: 1.1 },
];

const Hero = () => {
  const [entered, setEntered] = useState(false);

  const handleEnter = () => {
    setEntered(true);
    setTimeout(() => {
      document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
    }, 700);
  };

  return (
    <section
      id="home"
      className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden"
    >
      {/* Tech grid */}
      <div className="absolute inset-0 tech-grid-bg" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/[0.04] blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-accent/[0.04] blur-3xl" />

      {/* Glow lines */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-pulse-line"
          style={{
            width: '1px',
            height: `${150 + i * 30}px`,
            background: `linear-gradient(transparent, hsl(var(--primary) / 0.15), transparent)`,
            left: `${15 + i * 18}%`,
            top: `${8 + i * 12}%`,
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}

      <motion.div
        className="relative flex items-center justify-center"
        animate={entered ? { scale: 1.8, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      >
        {/* Floating tech icons */}
        {floatingIcons.map(({ Icon, x, y, delay }, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/30 hidden sm:block"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: 1,
              x: [x, x + 8, x],
              y: [y, y - 12, y],
            }}
            transition={{ duration: 5, delay, repeat: Infinity, repeatType: "reverse" }}
          >
            <Icon size={24} strokeWidth={1.5} />
          </motion.div>
        ))}

        {/* Connection lines */}
        <svg className="absolute w-[500px] h-[500px] pointer-events-none hidden sm:block" viewBox="-250 -250 500 500">
          {floatingIcons.slice(0, 6).map((icon, i) => (
            <motion.line
              key={i}
              x1={0} y1={0} x2={icon.x} y2={icon.y}
              stroke="hsl(var(--primary))"
              strokeWidth={0.4}
              strokeOpacity={0.1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.5, delay: icon.delay }}
            />
          ))}
        </svg>

        {/* Portal door */}
        <motion.button
          onClick={handleEnter}
          className="relative z-10 w-56 sm:w-64 h-72 sm:h-80 rounded-2xl bg-gradient-to-b from-primary via-primary/95 to-brand-dark flex flex-col items-center justify-center cursor-pointer animate-portal-glow group focus:outline-none"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <div className="absolute inset-[6px] rounded-[14px] border border-primary-foreground/15 flex flex-col items-center justify-center gap-5">
            {/* Spinning ring */}
            <motion.div
              className="w-14 h-14 rounded-full border-2 border-primary-foreground/40 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-primary-foreground/70" />
            </motion.div>

            <div className="space-y-2 text-center">
              <span className="text-primary-foreground font-heading text-xl sm:text-2xl font-bold tracking-wide block">
                Enter YAIDEV
              </span>
              <motion.div
                className="w-10 h-[2px] bg-primary-foreground/40 rounded-full mx-auto"
                animate={{ scaleX: [1, 1.6, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </div>

            <span className="text-primary-foreground/50 text-[11px] tracking-wider uppercase">
              Click to explore
            </span>
          </div>

          {/* Corner brackets */}
          {[
            'top-0 left-0 border-t border-l rounded-tl-2xl',
            'top-0 right-0 border-t border-r rounded-tr-2xl',
            'bottom-0 left-0 border-b border-l rounded-bl-2xl',
            'bottom-0 right-0 border-b border-r rounded-br-2xl',
          ].map((cls, i) => (
            <div key={i} className={`absolute ${cls} w-6 h-6 border-primary-foreground/20`} />
          ))}
        </motion.button>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: entered ? 0 : 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Scroll</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <ChevronDown size={16} className="text-muted-foreground/60" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
