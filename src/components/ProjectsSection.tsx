import { motion } from "framer-motion";
import { ExternalLink, ArrowRight, GraduationCap, Landmark, Building2, Layers } from "lucide-react";

const projects = [
  {
    title: "Ninjamatics Academy",
    icon: GraduationCap,
    link: "https://ng.ninjamatics.com",
    description: "A digital education-focused project built for Ninjamatics Academy.",
    tag: "Education",
  },
  {
    title: "Crystalink Capital",
    icon: Landmark,
    link: "https://www.crystalinkcapital.com",
    description: "A professional corporate website built for Crystalink Capital.",
    tag: "Finance",
  },
  {
    title: "Tikwatura Limited",
    icon: Building2,
    link: "https://www.tikwatura.com",
    description: "A business website project developed for Tikwatura Limited.",
    tag: "Business",
  },
  {
    title: "Others",
    icon: Layers,
    link: null,
    description: "Additional innovative digital projects across multiple sectors.",
    tag: "Multi-Sector",
  },
];

const ProjectsSection = () => (
  <section id="projects" className="py-28 bg-background section-divider">
    <div className="container mx-auto px-4">
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
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6">
          Selected <span className="text-primary">Projects</span>
        </h2>
        <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
          Yaidev has contributed to the development of digital platforms and technology-driven
          projects across education, finance, business, and innovation.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {projects.map(({ title, icon: Icon, link, description, tag }, i) => {
          const Wrapper = link ? "a" : "div";
          const linkProps = link
            ? { href: link, target: "_blank" as const, rel: "noopener noreferrer" }
            : {};

          return (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              whileHover={{ y: -5 }}
            >
              <Wrapper
                {...linkProps}
                className="group block bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-400 h-full"
              >
                {/* Top gradient */}
                <div className="h-1 w-full bg-gradient-to-r from-primary to-accent" />

                <div className="p-8">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <Icon
                        size={22}
                        className="text-primary group-hover:text-primary-foreground transition-colors duration-300"
                      />
                    </div>
                    <span className="text-[11px] font-medium tracking-wider uppercase text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-heading font-bold text-foreground mb-3 flex items-center gap-2">
                    {title}
                    {link && (
                      <ExternalLink
                        size={15}
                        className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                    )}
                  </h3>

                  <p className="text-muted-foreground text-[15px] leading-relaxed mb-5">
                    {description}
                  </p>

                  {link && (
                    <div className="flex items-center gap-2 text-primary text-sm font-medium">
                      <span>Visit Project</span>
                      <ArrowRight
                        size={14}
                        className="group-hover:translate-x-1 transition-transform duration-300"
                      />
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
