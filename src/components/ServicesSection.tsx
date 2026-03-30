import { motion } from "framer-motion";
import { PenTool, Rocket, Settings, Shield, BarChart3, Headphones } from "lucide-react";

const services = [
  { icon: PenTool, title: "Design & Branding", description: "Complete brand identity design, logos, style guides, and visual systems." },
  { icon: Rocket, title: "Product Development", description: "End-to-end product development from ideation to launch and beyond." },
  { icon: Settings, title: "Maintenance & Support", description: "Ongoing technical support, updates, bug fixes, and performance optimization." },
  { icon: Shield, title: "Cybersecurity", description: "Security audits, penetration testing, and secure development practices." },
  { icon: BarChart3, title: "Digital Marketing", description: "SEO, social media management, paid ads, and growth strategy consulting." },
  { icon: Headphones, title: "IT Consulting", description: "Strategic technology consulting to align your IT infrastructure with business goals." },
];

const ServicesSection = () => (
  <section id="services" className="py-24 bg-background">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
          Our <span className="text-primary">Services</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Comprehensive technology services tailored to your business needs.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(({ icon: Icon, title, description }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative bg-card rounded-xl p-8 border border-border hover:border-primary/30 transition-all duration-300 group overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            <Icon className="text-primary mb-5" size={28} />
            <h3 className="text-xl font-heading font-semibold text-foreground mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ServicesSection;
