import { motion } from "framer-motion";
import { Users, Bot, ArrowRight, Zap, Shield } from "lucide-react";

const BuildNowSection = ({ onOpenAiBuilder }: { onOpenAiBuilder: () => void }) => (
  <section id="build-now" className="relative overflow-hidden">
    {/* Background */}
    <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/30" />
    <div className="absolute inset-0 tech-grid-bg opacity-40" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[100px]" />

    <div className="container mx-auto px-4 lg:px-8 py-32 relative z-10">
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
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-5">
          Build <span className="text-primary">Now</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
          Choose your path — work with our expert team or harness the power of AI to build your next project.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Human Experts */}
        <motion.a
          href="https://wa.me/2349047188353?text=Good%20Day%20Yaidev%2C%20I%20need%20a%20technology%20to%20be%20build%20by%20a%20human%20for%20me"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.98 }}
          className="group relative bg-primary text-primary-foreground rounded-2xl p-10 flex flex-col text-center cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-foreground/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-foreground/20 transition-colors duration-300">
              <Users size={28} />
            </div>
            <h3 className="text-xl md:text-2xl font-heading font-bold mb-3 leading-snug">
              Let Our Human Experts Build For You
            </h3>
            <p className="text-primary-foreground/65 text-sm leading-relaxed mb-6">
              Websites · Apps · Software · Games · Bots · Images · Logos · Videos · Audios · Designs · Any Other Thing
            </p>

            <div className="flex items-center justify-center gap-4 mb-6 text-primary-foreground/40 text-xs">
              <span className="flex items-center gap-1"><Shield size={12} /> Custom Delivery</span>
              <span className="flex items-center gap-1"><Zap size={12} /> Expert Team</span>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-primary-foreground/90 group-hover:text-primary-foreground transition-colors">
              <span>Chat on WhatsApp</span>
              <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300" />
            </div>
          </div>
        </motion.a>

        {/* AI Build */}
        <motion.button
          onClick={onOpenAiBuilder}
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.98 }}
          className="group relative bg-primary text-primary-foreground rounded-2xl p-10 flex flex-col text-center cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-foreground/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-foreground/20 transition-colors duration-300">
              <Bot size={28} />
            </div>
            <h3 className="text-xl md:text-2xl font-heading font-bold mb-3 leading-snug">
              Let AI Build For You
            </h3>
            <p className="text-primary-foreground/65 text-sm leading-relaxed mb-6">
              Websites · Apps · Software · Games · Bots · Images · Logos · Videos · Audios · Designs · Any Other Thing
            </p>

            <div className="flex items-center justify-center gap-4 mb-6 text-primary-foreground/40 text-xs">
              <span className="flex items-center gap-1"><Zap size={12} /> Instant</span>
              <span className="flex items-center gap-1"><Shield size={12} /> AI-Powered</span>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-primary-foreground/90 group-hover:text-primary-foreground transition-colors">
              <span>Open AI Builder</span>
              <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300" />
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  </section>
);

export default BuildNowSection;
