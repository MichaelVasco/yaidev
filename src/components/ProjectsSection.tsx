import { motion } from "framer-motion";
import FloatingParticles from "@/components/FloatingParticles";
import { ExternalLink, ArrowRight, GraduationCap, Landmark, Building2, Layers } from "lucide-react";

const projects = [
  {
    title: "Ninjamatics Academy",
    icon: GraduationCap,
    link: "https://ng.ninjamatics.com",
    description: "A digital education-focused project built for Ninjamatics Academy — empowering learners through technology.",
    tag: "Education",
    gradient: "from-blue to-purple",
  },
  {
    title: "Crystalink Capital",
    icon: Landmark,
    link: "https://www.crystalinkcapital.com",
    description: "A professional corporate website built for Crystalink Capital — designed for trust and institutional credibility.",
    tag: "Finance",
    gradient: "from-purple to-cyan",
  },
  {
    title: "Tikwatura Limited",
    icon: Building2,
    link: "https://www.tikwatura.com",
    description: "A business website project developed for Tikwatura Limited — driving digital presence and brand visibility.",
    tag: "Business",
    gradient: "from-teal to-blue",
  },
  {
    title: "More Projects",
    icon: Layers,
    link: null,
    description: "Additional innovative digital projects across multiple sectors — spanning healthcare, logistics, media, and more.",
    tag: "Multi-Sector",
    gradient: "from-cyan to-teal",
  },
];

const ProjectsSection = () => (
  <section id="projects" className="py-28 bg-white section-divider relative">
    <div className="absolute inset-0 tech-grid-bg opacity-40 pointer-events-none" />
    <FloatingParticles count={20} className="opacity-30" />
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
          Our Work
        </motion.span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-5">
          Selected <span className="text-gradient-cyan">Projects</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
          Yaidev has contributed to the development of digital platforms and technology-driven
          projects across education, finance, business, and innovation.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
        {projects.map(({ title, icon: Icon, link, description, tag, gradient }, i) => {
          const isLink = !!link;
          const Wrapper = isLink ? "a" : "div";
          const linkProps = isLink
            ? { href: link, target: "_blank" as const, rel: "noopener noreferrer" }
            : {};

          return (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              whileHover={{ y: -4 }}
            >
              <Wrapper
                {...linkProps}
                className="group block bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg hover:shadow-blue/8 hover:border-primary/15 transition-all duration-400 h-full cursor-pointer pointer-events-auto touch-manipulation"
              >
                <div className={`h-0.5 w-full bg-gradient-to-r ${gradient}`} />
                <div className="p-7">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center transition-colors duration-300">
                      <Icon size={20} className="text-primary transition-colors duration-300" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider uppercase bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                      {tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-heading font-bold text-foreground mb-2.5 flex items-center gap-2">
                    {title}
                    {isLink && (
                      <ExternalLink size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                  </h3>

                  <p className="text-muted-foreground text-sm leading-relaxed mb-5">{description}</p>

                  {isLink && (
                    <div className="flex items-center gap-2 text-primary text-sm font-medium">
                      <span>View Project</span>
                      <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  )}
                </div>
              </Wrapper>
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);

export default ProjectsSection;
