import { motion } from "framer-motion";
import {
  Globe, Smartphone, Monitor, Gamepad2, Bot, ImageIcon,
  Hexagon, Video, Music, PenTool, Sparkles, ArrowRight
} from "lucide-react";
import FloatingParticles from "@/components/FloatingParticles";

const services = [
  { icon: Globe, title: "Websites", description: "High-performance, responsive websites built for speed, SEO, and conversion." },
  { icon: Smartphone, title: "Apps", description: "Native and cross-platform mobile apps with seamless user experiences." },
  { icon: Monitor, title: "Software", description: "Enterprise-grade software systems engineered for reliability and scale." },
  { icon: Gamepad2, title: "Games", description: "Immersive gaming experiences across web, mobile, and desktop platforms." },
  { icon: Bot, title: "Bots", description: "Intelligent chatbots and virtual assistants powered by advanced AI." },
  { icon: ImageIcon, title: "Images", description: "AI-generated visuals, product imagery, and custom digital artwork." },
  { icon: Hexagon, title: "Logos", description: "Professional brand identity and logo design with creative precision." },
  { icon: Video, title: "Videos", description: "Cinematic video production, motion graphics, and AI-powered content." },
  { icon: Music, title: "Audio", description: "Studio-quality audio production, voiceovers, and sound design." },
  { icon: PenTool, title: "Designs", description: "UI/UX design, marketing assets, presentations, and brand collateral." },
  { icon: Sparkles, title: "Anything Else", description: "If you can imagine it, we can build it — no limits, no boundaries." },
];

const ServicesSection = () => (
  <section id="services" className="py-28 bg-white section-divider relative overflow-hidden">
    <div className="absolute inset-0 tech-grid-bg opacity-30 pointer-events-none" />
    <FloatingParticles count={25} className="opacity-40" />
    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-blue/[0.04] blur-[80px] pointer-events-none" />
    <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full bg-teal/[0.03] blur-[100px] pointer-events-none" />

    <div className="container mx-auto px-4 lg:px-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-20"
      >
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-4 block"
        >
          Our Capabilities
        </motion.span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-5">
          What We <span className="text-gradient-teal">Build</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
          Powerful technology creation solutions through intelligent systems and expert execution.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-14">
        {services.map(({ icon: Icon, title, description }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
            whileHover={{ y: -3 }}
            className="group relative bg-white rounded-xl border border-border p-5 hover:border-primary/20 shadow-sm hover:shadow-md hover:shadow-blue/5 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue to-purple scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

            <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center mb-3 transition-colors duration-300">
              <Icon size={20} className="text-primary transition-colors duration-300" />
            </div>
            <h3 className="text-sm font-heading font-semibold text-foreground mb-1.5">{title}</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto text-center"
      >
        <div className="bg-white border border-border rounded-2xl px-8 py-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <p className="text-base md:text-lg font-heading font-medium text-foreground leading-relaxed">
            "Yaidev helps clients bring ideas to life through{" "}
            <span className="text-primary font-semibold">AI-powered creation tools</span> and{" "}
            <span className="text-primary font-semibold">human expert execution</span>."
          </p>
          <a href="/#build-now" className="inline-flex items-center gap-2 mt-5 text-primary text-sm font-semibold hover:gap-3 transition-all cursor-pointer pointer-events-auto touch-manipulation">
            Start Building <ArrowRight size={14} />
          </a>
        </div>
      </motion.div>
    </div>
  </section>
);

export default ServicesSection;
