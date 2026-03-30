import { motion } from "framer-motion";
import {
  Globe, Smartphone, Monitor, Gamepad2, Bot, ImageIcon,
  Hexagon, Video, Music, PenTool, Sparkles
} from "lucide-react";

const services = [
  { icon: Globe, title: "Websites", description: "High-performance, responsive websites built for speed, SEO, and conversion." },
  { icon: Smartphone, title: "Apps", description: "Native and cross-platform mobile applications with seamless user experiences." },
  { icon: Monitor, title: "Softwares", description: "Enterprise-grade software systems engineered for reliability and scale." },
  { icon: Gamepad2, title: "Games", description: "Immersive gaming experiences across web, mobile, and desktop platforms." },
  { icon: Bot, title: "Bots", description: "Intelligent chatbots and virtual assistants powered by advanced AI." },
  { icon: ImageIcon, title: "Create Images", description: "AI-generated visuals, product imagery, and custom digital artwork." },
  { icon: Hexagon, title: "Create Logos", description: "Professional brand identity and logo design with creative precision." },
  { icon: Video, title: "Create Videos", description: "Cinematic video production, motion graphics, and AI-powered video content." },
  { icon: Music, title: "Create Audios", description: "Studio-quality audio production, voiceovers, and sound design." },
  { icon: PenTool, title: "Create Designs", description: "UI/UX design, marketing assets, presentations, and brand collateral." },
  { icon: Sparkles, title: "Create Any Other Thing", description: "If you can imagine it, we can build it — no limits, no boundaries." },
];

const ServicesSection = () => (
  <section id="services" className="py-28 bg-background relative overflow-hidden">
    {/* Subtle background pattern */}
    <div className="absolute inset-0 opacity-[0.02]" style={{
      backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)',
      backgroundSize: '32px 32px',
    }} />

    <div className="container mx-auto px-4 relative z-10">
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
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6">
          What We <span className="text-primary">Build</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
          Yaidev delivers powerful technology creation solutions through intelligent systems and expert execution.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-16">
        {services.map(({ icon: Icon, title, description }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -4 }}
            className="group relative bg-card rounded-xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-400 overflow-hidden"
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
              <Icon size={22} className="text-primary group-hover:text-primary-foreground transition-colors duration-300" />
            </div>
            <h3 className="text-base font-heading font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
          </motion.div>
        ))}
      </div>

      {/* Highlighted statement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center"
      >
        <div className="bg-primary/5 border border-primary/15 rounded-2xl px-8 py-10">
          <Sparkles className="mx-auto mb-4 text-primary" size={28} />
          <p className="text-lg md:text-xl font-heading font-medium text-foreground leading-relaxed">
            "Yaidev helps clients bring ideas to life through{" "}
            <span className="text-primary">AI-powered creation tools</span> and{" "}
            <span className="text-primary">human expert execution</span>."
          </p>
        </div>
      </motion.div>
    </div>
  </section>
);

export default ServicesSection;
