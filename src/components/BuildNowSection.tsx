import { motion } from "framer-motion";
import { Users, Bot, ArrowRight } from "lucide-react";

const BuildNowSection = () => (
  <section id="build-now" className="min-h-[80vh] flex items-center justify-center bg-background relative">
    {/* Subtle dot grid */}
    <div className="absolute inset-0 opacity-[0.025]" style={{
      backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)',
      backgroundSize: '28px 28px',
    }} />

    <div className="container mx-auto px-4 py-28 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-xs font-medium tracking-[0.25em] uppercase text-primary mb-4 block"
        >
          Get Started
        </motion.span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground">
          Build <span className="text-primary">Now</span>
        </h2>
      </motion.div>

      <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 max-w-4xl mx-auto">
        {/* Human Experts */}
        <motion.a
          href="https://wa.me/2349047188353?text=Good%20Day%20Yaidev%2C%20I%20need%20a%20technology%20to%20be%20build%20by%20a%20human%20for%20me"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 group bg-primary text-primary-foreground rounded-2xl p-10 md:p-12 flex flex-col items-center justify-center text-center cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-400"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/15 flex items-center justify-center mb-6 group-hover:bg-primary-foreground/25 transition-colors duration-300">
            <Users size={32} />
          </div>
          <h3 className="text-xl md:text-2xl font-heading font-bold mb-4 leading-snug">
            Let Our Human Experts Build For You
          </h3>
          <p className="text-primary-foreground/75 text-sm leading-relaxed">
            ( Websites / Apps / Softwares / Games / Bots / Images / Logos / Videos / Audios / Designs / Any Other Thing )
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary-foreground/80 group-hover:text-primary-foreground transition-colors">
            <span>Get Started</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
          </div>
          <p className="mt-4 text-primary-foreground/50 text-xs">
            Speak directly with our human team for custom delivery.
          </p>
        </motion.a>

        {/* AI Build */}
        <motion.a
          href="#contact"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 group bg-primary text-primary-foreground rounded-2xl p-10 md:p-12 flex flex-col items-center justify-center text-center cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-400"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/15 flex items-center justify-center mb-6 group-hover:bg-primary-foreground/25 transition-colors duration-300">
            <Bot size={32} />
          </div>
          <h3 className="text-xl md:text-2xl font-heading font-bold mb-4 leading-snug">
            Let AI Build For You
          </h3>
          <p className="text-primary-foreground/75 text-sm leading-relaxed">
            ( Websites / Apps / Softwares / Games / Bots / Images / Logos / Videos / Audios / Designs / Any Other Thing )
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary-foreground/80 group-hover:text-primary-foreground transition-colors">
            <span>Get Started</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </motion.a>
      </div>
    </div>
  </section>
);

export default BuildNowSection;
