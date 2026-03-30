import { useState } from "react";
import { motion } from "framer-motion";
import {
  Monitor, Smartphone, Code2, Gamepad2, Bot, Palette,
  Laptop, BrainCircuit, Globe, Cpu, Terminal, Layers
} from "lucide-react";

const floatingIcons = [
  { Icon: Laptop, x: -180, y: -120, delay: 0 },
  { Icon: Smartphone, x: 180, y: -100, delay: 0.3 },
  { Icon: Code2, x: -220, y: 40, delay: 0.6 },
  { Icon: Gamepad2, x: 200, y: 60, delay: 0.9 },
  { Icon: Bot, x: -140, y: 140, delay: 1.2 },
  { Icon: Palette, x: 160, y: 140, delay: 0.4 },
  { Icon: Monitor, x: -60, y: -160, delay: 0.7 },
  { Icon: BrainCircuit, x: 80, y: -150, delay: 1.0 },
  { Icon: Globe, x: -250, y: -30, delay: 0.2 },
  { Icon: Cpu, x: 250, y: -20, delay: 0.5 },
  { Icon: Terminal, x: -100, y: 180, delay: 0.8 },
  { Icon: Layers, x: 100, y: 180, delay: 1.1 },
];

const Hero = () => {
  const [entered, setEntered] = useState(false);

  const handleEnter = () => {
    setEntered(true);
    setTimeout(() => {
      document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
    }, 600);
  };

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden pt-16"
    >
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Glow lines */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-pulse-line"
          style={{
            width: '1px',
            height: '200px',
            background: `linear-gradient(transparent, hsl(var(--primary) / 0.2), transparent)`,
            left: `${20 + i * 20}%`,
            top: `${10 + i * 15}%`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      <motion.div
        className="relative flex items-center justify-center"
        animate={entered ? { scale: 1.5, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Floating tech icons */}
        {floatingIcons.map(({ Icon, x, y, delay }, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/40"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: 1,
              x: [x, x + 10, x],
              y: [y, y - 15, y],
            }}
            transition={{
              duration: 4,
              delay,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            <Icon size={28} />
          </motion.div>
        ))}

        {/* Connection lines */}
        <svg className="absolute w-[500px] h-[500px] pointer-events-none" viewBox="-250 -250 500 500">
          {floatingIcons.slice(0, 6).map((icon, i) => (
            <motion.line
              key={i}
              x1={0} y1={0}
              x2={icon.x} y2={icon.y}
              stroke="hsl(var(--primary))"
              strokeWidth={0.5}
              strokeOpacity={0.15}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: icon.delay }}
            />
          ))}
        </svg>

        {/* Portal door */}
        <motion.button
          onClick={handleEnter}
          className="relative z-10 w-64 h-80 rounded-2xl bg-gradient-to-b from-primary to-brand-dark flex flex-col items-center justify-center cursor-pointer animate-portal-glow group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Inner glow */}
          <div className="absolute inset-2 rounded-xl border border-primary-foreground/20 flex flex-col items-center justify-center gap-4">
            <motion.div
              className="w-12 h-12 rounded-full border-2 border-primary-foreground/60"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-full h-full rounded-full border-t-2 border-primary-foreground" />
            </motion.div>

            <span className="text-primary-foreground font-heading text-xl font-bold tracking-wider">
              Enter YAIDEV
            </span>

            <motion.div
              className="w-8 h-0.5 bg-primary-foreground/50 rounded-full"
              animate={{ scaleX: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <span className="text-primary-foreground/60 text-xs mt-2">
              Click to explore
            </span>
          </div>

          {/* Corner accents */}
          {['-top-1 -left-1', '-top-1 -right-1', '-bottom-1 -left-1', '-bottom-1 -right-1'].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-3 h-3 border-primary-foreground/30 ${
              i < 2 ? 'border-t-2' : 'border-b-2'
            } ${i % 2 === 0 ? 'border-l-2' : 'border-r-2'}`} />
          ))}
        </motion.button>
      </motion.div>
    </section>
  );
};

export default Hero;
