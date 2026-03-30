import { motion } from "framer-motion";
import { Users, Bot } from "lucide-react";

const BuildNowSection = () => (
  <section id="build-now" className="py-24 bg-secondary/50">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
          Ready to <span className="text-primary">Build?</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Choose how you want your project built — by our expert team or powered by AI.
        </p>
      </motion.div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 max-w-3xl mx-auto">
        <motion.a
          href="#contact"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 w-full sm:w-auto bg-primary text-primary-foreground rounded-xl p-8 text-center cursor-pointer hover:shadow-xl transition-shadow duration-300"
        >
          <Users className="mx-auto mb-4" size={36} />
          <h3 className="text-lg font-heading font-bold mb-2">
            Let Our Human Experts Build For You
          </h3>
          <p className="text-primary-foreground/80 text-sm">
            ( Websites / Apps / Softwares / Games / Bots )
          </p>
        </motion.a>

        <motion.a
          href="#contact"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 w-full sm:w-auto bg-primary text-primary-foreground rounded-xl p-8 text-center cursor-pointer hover:shadow-xl transition-shadow duration-300"
        >
          <Bot className="mx-auto mb-4" size={36} />
          <h3 className="text-lg font-heading font-bold mb-2">
            Let AI Build For You
          </h3>
          <p className="text-primary-foreground/80 text-sm">
            ( Websites / Apps / Softwares / Games / Bots )
          </p>
        </motion.a>
      </div>
    </div>
  </section>
);

export default BuildNowSection;
