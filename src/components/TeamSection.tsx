import { motion } from "framer-motion";
import { Crown, Globe2, MapPin, User, Linkedin } from "lucide-react";
import founderImg from "@/assets/founder.jpg";

const executives = [
  { name: "Iregbu MichaelVasco", title: "Founder, Chairman & CEO", location: "San Francisco, CA", isCeo: true },
  { name: "Name Withheld", title: "Global President", location: "Global Operations", isCeo: false },
  { name: "Name Withheld", title: "Country Manager", location: "United States of America", isCeo: false },
  { name: "Name Withheld", title: "Country Manager", location: "United Kingdom", isCeo: false },
  { name: "Name Withheld", title: "Country Manager", location: "Canada", isCeo: false },
  { name: "Name Withheld", title: "Country Manager", location: "Australia", isCeo: false },
  { name: "Name Withheld", title: "Country Manager", location: "Nigeria", isCeo: false },
];

const TeamSection = () => (
  <section id="team" className="py-28 bg-secondary/40 section-divider">
    <div className="container mx-auto px-4 lg:px-8">
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
          Leadership
        </motion.span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-5">
          Our Leadership & <span className="text-primary">Global Team</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base">
          A world-class executive team driving innovation across six continents.
        </p>
      </motion.div>

      {/* CEO — Featured */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto mb-14"
      >
        <div className="relative bg-card rounded-2xl border border-primary/15 overflow-hidden shadow-lg group hover:shadow-xl transition-shadow duration-500">
          <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />
          <div className="p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8">
            <div className="relative flex-shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden ring-2 ring-primary/15 ring-offset-4 ring-offset-card">
                <img
                  src={founderImg}
                  alt="Iregbu MichaelVasco — Founder, Chairman & CEO"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Crown size={14} className="text-primary-foreground" />
              </div>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h3 className="text-2xl font-heading font-bold text-foreground tracking-tight">
                Iregbu MichaelVasco
              </h3>
              <p className="text-primary font-semibold text-sm mt-1">Founder, Chairman & CEO</p>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-3 text-muted-foreground text-sm">
                <MapPin size={13} />
                <span>San Francisco, CA</span>
              </div>
              <p className="text-muted-foreground text-sm mt-4 leading-relaxed max-w-md">
                Visionary technology leader, serial entrepreneur, and architect of Yaidev's global mission to democratize intelligent technology creation.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Other executives */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {executives.filter((e) => !e.isCeo).map(({ name, title, location }, i) => (
          <motion.div
            key={`${title}-${location}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            whileHover={{ y: -3 }}
            className="group bg-card rounded-xl border border-border p-6 hover:border-primary/20 hover:shadow-md transition-all duration-400"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors duration-300">
              {title === "Global President" ? (
                <Globe2 size={20} className="text-primary" />
              ) : (
                <User size={20} className="text-primary" />
              )}
            </div>
            <h4 className="font-heading font-bold text-foreground text-base">{name}</h4>
            <p className="text-primary text-sm font-medium mt-0.5">{title}</p>
            <div className="flex items-center gap-1.5 mt-2.5 text-muted-foreground text-xs">
              <MapPin size={11} />
              <span>{location}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TeamSection;
