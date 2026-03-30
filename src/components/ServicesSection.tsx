import { motion } from "framer-motion";
import {
  Globe, Smartphone, Monitor, Gamepad2, Bot, ImageIcon,
  Hexagon, Video, Music, PenTool, Sparkles, ArrowRight
} from "lucide-react";

const services = [
  { icon: Globe, title: "Websites", description: "High-performance, responsive websites built for speed, SEO, and conversion.", color: "text-blue", bg: "bg-blue/10 group-hover:bg-blue/20" },
  { icon: Smartphone, title: "Apps", description: "Native and cross-platform mobile apps with seamless user experiences.", color: "text-purple", bg: "bg-purple/10 group-hover:bg-purple/20" },
  { icon: Monitor, title: "Software", description: "Enterprise-grade software systems engineered for reliability and scale.", color: "text-teal", bg: "bg-teal/10 group-hover:bg-teal/20" },
  { icon: Gamepad2, title: "Games", description: "Immersive gaming experiences across web, mobile, and desktop platforms.", color: "text-cyan", bg: "bg-cyan/10 group-hover:bg-cyan/20" },
  { icon: Bot, title: "Bots", description: "Intelligent chatbots and virtual assistants powered by advanced AI.", color: "text-blue", bg: "bg-blue/10 group-hover:bg-blue/20" },
  { icon: ImageIcon, title: "Images", description: "AI-generated visuals, product imagery, and custom digital artwork.", color: "text-purple", bg: "bg-purple/10 group-hover:bg-purple/20" },
  { icon: Hexagon, title: "Logos", description: "Professional brand identity and logo design with creative precision.", color: "text-teal", bg: "bg-teal/10 group-hover:bg-teal/20" },
  { icon: Video, title: "Videos", description: "Cinematic video production, motion graphics, and AI-powered content.", color: "text-cyan", bg: "bg-cyan/10 group-hover:bg-cyan/20" },
  { icon: Music, title: "Audio", description: "Studio-quality audio production, voiceovers, and sound design.", color: "text-blue", bg: "bg-blue/10 group-hover:bg-blue/20" },
  { icon: PenTool, title: "Designs", description: "UI/UX design, marketing assets, presentations, and brand collateral.", color: "text-purple", bg: "bg-purple/10 group-hover:bg-purple/20" },
  { icon: Sparkles, title: "Anything Else", description: "If you can imagine it, we can build it — no limits, no boundaries.", color: "text-teal", bg: "bg-teal/10 group-hover:bg-teal/20" },
];

const gradients = [
  "from-blue to-purple",
  "from-purple to-cyan",
  "from-teal to-blue",
  "from-cyan to-teal",
];

const ServicesSection = () => (
  <section id="services" className="py-28 bg-background section-divider relative overflow-hidden">
    <div className="absolute inset-0 tech-grid-bg opacity-30" />
    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-purple/[0.03] blur-[80px]" />
    <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full bg-teal/[0.02] blur-[100px]" />

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
          className="text-xs font-medium tracking-[0.25em] uppercase text-teal mb-4 block"
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
        {services.map(({ icon: Icon, title, description, color, bg }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
            whileHover={{ y: -3 }}
            className="group relative bg-card rounded-xl border border-border p-5 hover:border-blue/15 hover:shadow-md transition-all duration-300 overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${gradients[i % gradients.length]} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />

            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3 transition-colors duration-300`}>
              <Icon size={20} className={`${color} transition-colors duration-300`} />
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
        <div className="bg-card border border-border rounded-2xl px-8 py-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue/30 to-transparent" />
          <p className="text-base md:text-lg font-heading font-medium text-foreground leading-relaxed">
            "Yaidev helps clients bring ideas to life through{" "}
            <span className="text-blue font-semibold">AI-powered creation tools</span> and{" "}
            <span className="text-purple font-semibold">human expert execution</span>."
          </p>
          <a href="#build-now" className="inline-flex items-center gap-2 mt-5 text-teal text-sm font-semibold hover:gap-3 transition-all">
            Start Building <ArrowRight size={14} />
          </a>
        </div>
      </motion.div>
    </div>
  </section>
);

export default ServicesSection;
