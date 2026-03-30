import { motion } from "framer-motion";
import { Building2, Globe2, Lightbulb, Rocket, Award, BookOpen } from "lucide-react";
import founderImg from "@/assets/founder.jpg";

const highlights = [
  { icon: Building2, label: "San Francisco, CA" },
  { icon: Globe2, label: "Global Operations" },
  { icon: Lightbulb, label: "AI & Innovation" },
  { icon: Rocket, label: "Future-Focused" },
];

const AboutSection = () => (
  <section id="about" className="py-28 bg-background section-divider relative">
    <div className="absolute inset-0 tech-grid-bg opacity-50" />
    <div className="container mx-auto px-4 lg:px-8 relative z-10">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-20"
      >
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-xs font-medium tracking-[0.25em] uppercase text-blue mb-4 block"
        >
          Who We Are
        </motion.span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground">
          About <span className="text-gradient">Yaidev Corporation</span>
        </h2>
      </motion.div>

      {/* Icon highlights bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap justify-center gap-6 mb-20"
      >
        {highlights.map(({ icon: Icon, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card text-sm text-muted-foreground"
          >
            <Icon size={16} className={["text-blue", "text-purple", "text-teal", "text-cyan"][i]} />
            {label}
          </motion.div>
        ))}
      </motion.div>

      {/* Main content: Image + Text */}
      <div className="grid lg:grid-cols-2 gap-16 items-start">
        {/* Left — Founder Image & Card */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center lg:items-start"
        >
          <div className="relative group">
            {/* Decorative frame */}
            <div className="absolute -inset-3 rounded-2xl border-2 border-blue/10 -z-10 group-hover:border-blue/25 transition-colors duration-500" />
            <div className="absolute -inset-6 rounded-3xl border border-border/50 -z-20" />

            <div className="w-72 md:w-80 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={founderImg}
                alt="Iregbu MichaelVasco — Founder, Chairman & CEO of Yaidev Corporation"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
              />
            </div>

            {/* Accent corner */}
            <div className="absolute -bottom-2 -right-2 w-16 h-16 border-b-2 border-r-2 border-primary/30 rounded-br-2xl" />
            <div className="absolute -top-2 -left-2 w-16 h-16 border-t-2 border-l-2 border-primary/30 rounded-tl-2xl" />
          </div>

          {/* Founder Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 bg-card border border-border rounded-xl p-6 w-72 md:w-80 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue/10 flex items-center justify-center flex-shrink-0">
                <Award size={20} className="text-blue" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-foreground text-lg leading-tight">
                  Iregbu MichaelVasco
                </h4>
                <p className="text-blue text-sm font-medium">
                  Founder, Chairman & CEO
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-start gap-3">
              <BookOpen size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground text-xs leading-relaxed">
                Serial Entrepreneur · Author · Singer · Visionary Technology Leader
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right — About Text */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="space-y-6"
        >
          <div className="space-y-5 text-muted-foreground leading-[1.85] text-[15px]">
            <p>
              <span className="text-foreground font-semibold">Yaidev Corporation</span> is a
              forward-thinking technology company incorporated in{" "}
              <span className="text-foreground font-medium">San Francisco, California, United States of America</span>.
              The company is singularly focused on engineering innovative digital solutions that
              empower individuals, businesses, and organizations to create, launch, scale, and
              derive transformative value from world-class technology.
            </p>

            <p>
              Operating at the powerful intersection of{" "}
              <span className="text-foreground font-medium">artificial intelligence, advanced software development,
              digital infrastructure, creative technology, and business innovation</span>,
              Yaidev is building the tools, platforms, and ecosystems that define the next era of
              intelligent digital transformation. From AI-driven platforms to enterprise-grade
              software and digital products, the company delivers solutions designed for global
              impact, operational excellence, and long-term competitive advantage.
            </p>

            <div className="border-l-2 border-primary/40 pl-5 py-1">
              <p className="italic text-foreground/80">
                "Our mission is to make world-class technology accessible to every ambitious
                individual and forward-thinking organization on the planet."
              </p>
            </div>

            <p>
              The Founder, Chairman, and Chief Executive Officer of Yaidev Corporation is{" "}
              <span className="text-foreground font-semibold">Iregbu MichaelVasco</span> — a
              35-year-old visionary, Nigerian-born American serial entrepreneur, celebrated singer,
              and author of numerous acclaimed books. Widely recognized for his bold strategic
              vision, relentless creativity, innovation-driven mindset, and unwavering commitment
              to building technology platforms that empower people and businesses on a global scale,
              MichaelVasco represents a new generation of transformative technology leadership.
            </p>

            <p>
              His work spans an extraordinary breadth of disciplines — from technology development
              and entrepreneurship to digital product creation, AI platform architecture, media
              innovation, and large-scale business transformation. Under his dynamic leadership,
              Yaidev Corporation is strategically positioned to emerge as a{" "}
              <span className="text-foreground font-medium">dominant global force in the
              future of intelligent technology creation</span>, shaping industries and inspiring
              the next wave of innovation-led growth across markets worldwide.
            </p>
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-4 pt-6 border-t border-border"
          >
            {[
              { value: "50+", label: "Projects Delivered" },
              { value: "Global", label: "Market Reach" },
              { value: "AI-First", label: "Innovation Model" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-heading font-bold text-primary">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default AboutSection;
