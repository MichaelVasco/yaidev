import { motion } from "framer-motion";
import { Tv, CreditCard, BrainCircuit, ExternalLink, ArrowRight } from "lucide-react";

const products = [
  {
    name: "AdsTVAI",
    icon: Tv,
    link: "https://adstvai.lovable.app",
    description:
      "An innovative platform in the digital advertising and AI space designed to help transform advertising value and intelligent media experiences.",
    color: "from-primary to-accent",
  },
  {
    name: "Paywithads",
    icon: CreditCard,
    link: "https://paywithadspaymentgateway.lovable.app",
    description:
      "A payment-focused platform built around innovation in digital transactions, monetization, and next-generation payment accessibility.",
    color: "from-accent to-primary",
  },
  {
    name: "Yaiver",
    icon: BrainCircuit,
    link: "https://yaiver.lovable.app",
    description:
      "An AI-powered technology creation platform focused on helping users build digital solutions faster, smarter, and more efficiently.",
    color: "from-primary via-accent to-brand-dark",
  },
];

const ProductsSection = () => (
  <section id="products" className="py-28 bg-secondary/50">
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
          What We Build
        </motion.span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6">
          Our <span className="text-primary">Products</span>
        </h2>
        <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
          Yaidev Corporation builds and owns forward-looking technology products designed to serve
          individuals, businesses, and the future of digital commerce, media, AI, and intelligent
          automation.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {products.map(({ name, icon: Icon, link, description, color }, i) => (
          <motion.a
            key={name}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            whileHover={{ y: -6 }}
            className="group relative bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500 flex flex-col"
          >
            {/* Top gradient accent */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${color}`} />

            <div className="p-8 flex flex-col flex-1">
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                <Icon className="text-primary" size={26} />
              </div>

              {/* Name */}
              <h3 className="text-2xl font-heading font-bold text-foreground mb-3 flex items-center gap-2">
                {name}
                <ExternalLink
                  size={16}
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </h3>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed text-[15px] flex-1">
                {description}
              </p>

              {/* CTA */}
              <div className="mt-6 pt-5 border-t border-border flex items-center gap-2 text-primary text-sm font-medium">
                <span>Visit Product</span>
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform duration-300"
                />
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  </section>
);

export default ProductsSection;
