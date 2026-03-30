import { motion } from "framer-motion";
import { Globe, Smartphone, Code, Gamepad2, Bot, Palette } from "lucide-react";

const products = [
  {
    icon: Globe,
    title: "Custom Websites",
    description: "Responsive, SEO-optimized websites with modern design that convert visitors into customers.",
  },
  {
    icon: Smartphone,
    title: "Mobile Applications",
    description: "Native and cross-platform mobile apps for iOS and Android with seamless user experiences.",
  },
  {
    icon: Code,
    title: "Software Solutions",
    description: "Enterprise-grade software systems, CRMs, ERPs, and custom business tools built to scale.",
  },
  {
    icon: Gamepad2,
    title: "Games & Interactive",
    description: "Engaging games and interactive experiences for web, mobile, and desktop platforms.",
  },
  {
    icon: Bot,
    title: "AI Bots & Automation",
    description: "Intelligent chatbots, virtual assistants, and workflow automation powered by AI.",
  },
  {
    icon: Palette,
    title: "UI/UX Design",
    description: "Beautiful, user-centered designs with intuitive interfaces and premium visual identity.",
  },
];

const ProductsSection = () => (
  <section id="products" className="py-24 bg-secondary/50">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
          Our <span className="text-primary">Products</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          We build digital products that empower businesses and delight users.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(({ icon: Icon, title, description }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl p-8 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
              <Icon className="text-primary" size={24} />
            </div>
            <h3 className="text-xl font-heading font-semibold text-foreground mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ProductsSection;
