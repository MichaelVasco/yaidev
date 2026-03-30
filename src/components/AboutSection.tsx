import { motion } from "framer-motion";
import { Target, Users, Zap, TrendingUp } from "lucide-react";

const stats = [
  { icon: Target, value: "50+", label: "Projects Delivered" },
  { icon: Users, value: "30+", label: "Happy Clients" },
  { icon: Zap, value: "5+", label: "Years Experience" },
  { icon: TrendingUp, value: "99%", label: "Client Satisfaction" },
];

const AboutSection = () => (
  <section id="about" className="py-24 bg-background">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
          About <span className="text-primary">YAIDEV</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          We are a technology development company building world-class websites, mobile apps,
          software solutions, games, AI bots, and digital products for businesses across the globe.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl font-heading font-semibold text-foreground mb-4">Our Mission</h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            At YAIDEV, our mission is to democratize technology development. We believe every
            business deserves access to premium digital solutions — whether built by our expert
            human developers or powered by cutting-edge AI tools.
          </p>
          <h3 className="text-2xl font-heading font-semibold text-foreground mb-4">Our Vision</h3>
          <p className="text-muted-foreground leading-relaxed">
            To become the leading technology partner for businesses worldwide, delivering
            innovative digital solutions that drive growth, efficiency, and competitive advantage.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 gap-4"
        >
          {stats.map(({ icon: Icon, value, label }, i) => (
            <div
              key={i}
              className="bg-card rounded-xl p-6 text-center shadow-sm border border-border hover:shadow-md hover:border-primary/30 transition-all duration-300"
            >
              <Icon className="mx-auto mb-3 text-primary" size={28} />
              <div className="text-3xl font-heading font-bold text-foreground">{value}</div>
              <div className="text-sm text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  </section>
);

export default AboutSection;
