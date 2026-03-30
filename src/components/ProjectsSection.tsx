import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const projects = [
  {
    title: "E-Commerce Platform",
    category: "Web Application",
    description: "Full-featured online store with payment integration, inventory management, and analytics dashboard.",
  },
  {
    title: "HealthTrack Mobile App",
    category: "Mobile Application",
    description: "Cross-platform health monitoring app with real-time data sync and personalized wellness insights.",
  },
  {
    title: "AI Customer Support Bot",
    category: "AI / Automation",
    description: "Intelligent chatbot handling 80% of customer queries with natural language understanding.",
  },
  {
    title: "School Management System",
    category: "Enterprise Software",
    description: "Comprehensive school management platform with student records, grading, and parent portal.",
  },
];

const ProjectsSection = () => (
  <section id="projects" className="py-24 bg-background">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
          Our <span className="text-primary">Projects</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          A showcase of solutions we've built for clients across industries.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {projects.map(({ title, category, description }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl border border-border p-8 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {category}
              </span>
              <ExternalLink className="text-muted-foreground group-hover:text-primary transition-colors" size={16} />
            </div>
            <h3 className="text-xl font-heading font-semibold text-foreground mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ProjectsSection;
