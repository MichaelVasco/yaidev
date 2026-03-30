import { motion } from "framer-motion";
import founderImg from "@/assets/founder.jpg";

const TeamSection = () => (
  <section id="team" className="py-24 bg-secondary/50">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
          Meet The <span className="text-primary">Team</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Led by experienced professionals passionate about building great technology.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-sm mx-auto"
      >
        <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div className="aspect-square overflow-hidden">
            <img
              src={founderImg}
              alt="YAIDEV Founder"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="p-6 text-center">
            <h3 className="text-xl font-heading font-bold text-foreground">Founder & CEO</h3>
            <p className="text-primary font-medium mt-1">YAIDEV</p>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
              Visionary technology leader driving innovation and excellence in software development across Africa and beyond.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default TeamSection;
