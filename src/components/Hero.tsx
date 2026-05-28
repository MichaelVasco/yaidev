import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FloatingParticles from "@/components/FloatingParticles";
import {
  Monitor, Smartphone, Code2, Gamepad2, Bot, Palette,
  Laptop, BrainCircuit, Globe, Cpu, Terminal, Layers, ChevronDown
} from "lucide-react";

const floatingIcons = [
  { Icon: Laptop, x: -180, y: -120, delay: 0, color: "text-blue" },
  { Icon: Smartphone, x: 190, y: -105, delay: 0.3, color: "text-purple" },
  { Icon: Code2, x: -230, y: 35, delay: 0.6, color: "text-teal" },
  { Icon: Gamepad2, x: 210, y: 55, delay: 0.9, color: "text-cyan" },
  { Icon: Bot, x: -145, y: 145, delay: 1.2, color: "text-blue" },
  { Icon: Palette, x: 165, y: 145, delay: 0.4, color: "text-purple" },
  { Icon: Monitor, x: -65, y: -165, delay: 0.7, color: "text-teal" },
  { Icon: BrainCircuit, x: 85, y: -155, delay: 1.0, color: "text-cyan" },
  { Icon: Globe, x: -260, y: -25, delay: 0.2, color: "text-blue" },
  { Icon: Cpu, x: 260, y: -15, delay: 0.5, color: "text-purple" },
  { Icon: Terminal, x: -105, y: 185, delay: 0.8, color: "text-teal" },
  { Icon: Layers, x: 105, y: 185, delay: 1.1, color: "text-cyan" },
];

const Hero = () => {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!entered) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setEntered(false); },
      { threshold: 0.5 }
    );
    const el = document.getElementById("home");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [entered]);

  const handleEnter = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setEntered(true);
    setTimeout(() => {
      document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", "/#about");
    }, 700);
  };

  return (
    <section
      id="home"
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, hsl(214 40% 96%), hsl(210 40% 98%))" }}
    >
      <div className="absolute inset-0 tech-grid-bg" />
      <FloatingParticles count={50} />

      {/* Soft blue gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-blue/[0.06] blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-purple/[0.05] blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-teal/[0.03] blur-[120px]" />

      {/* Glow lines */}
      {[
        { color: "var(--color-blue)", left: "15%", top: "8%", h: 150 },
        { color: "var(--color-blue)", left: "33%", top: "20%", h: 180 },
        { color: "var(--color-teal)", left: "51%", top: "32%", h: 210 },
        { color: "var(--color-blue)", left: "69%", top: "44%", h: 240 },
        { color: "var(--color-blue)", left: "87%", top: "56%", h: 270 },
      ].map((line, i) => (
        <div
          key={i}
          className="absolute animate-pulse-line"
          style={{
            width: '1px',
            height: `${line.h}px`,
            background: `linear-gradient(transparent, hsl(${line.color} / 0.15), transparent)`,
            left: line.left,
            top: line.top,
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
        {floatingIcons.map(({ Icon, x, y, delay, color }, i) => (
          <motion.div
            key={i}
            className={`absolute ${color}/50 hidden sm:block`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
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
              stroke="hsl(var(--color-blue))"
              strokeWidth={0.4}
              strokeOpacity={0.12}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.5, delay: icon.delay }}
            />
          ))}
        </svg>

        {/* Portal door */}
        <motion.a
          href="/#about"
          onClick={handleEnter}
          className="relative z-10 w-56 sm:w-64 h-72 sm:h-80 rounded-2xl flex flex-col items-center justify-center cursor-pointer animate-portal-glow group focus:outline-none"
          style={{
            background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple) / 0.9))",
          }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <div className="absolute inset-[6px] rounded-[14px] border border-white/25 flex flex-col items-center justify-center gap-5">
            <motion.div
              className="w-14 h-14 rounded-full border-2 border-white/50 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-white/80" />
            </motion.div>

            <div className="space-y-2 text-center">
              <span className="text-white font-heading text-xl sm:text-2xl font-bold tracking-wide block">
                Enter YAIDEV
              </span>
              <motion.div
                className="w-10 h-[2px] rounded-full mx-auto bg-white/60"
                animate={{ scaleX: [1, 1.6, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </div>

            <span className="text-white/60 text-[11px] tracking-wider uppercase">
              Click to explore
            </span>
          </div>

          {[
            'top-0 left-0 border-t border-l rounded-tl-2xl',
            'top-0 right-0 border-t border-r rounded-tr-2xl',
            'bottom-0 left-0 border-b border-l rounded-bl-2xl',
            'bottom-0 right-0 border-b border-r rounded-br-2xl',
          ].map((cls, i) => (
            <div key={i} className={`absolute ${cls} w-6 h-6 border-white/30`} />
          ))}
        </motion.a>
      </motion.div>

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
