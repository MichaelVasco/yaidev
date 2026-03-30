import { motion } from "framer-motion";
import { Crown, Globe2, MapPin, User } from "lucide-react";
import founderImg from "@/assets/founder.jpg";

const executives = [
  {
    name: "Iregbu MichaelVasco",
    title: "Founder, Chairman & CEO",
    location: "San Francisco, CA",
    isCeo: true,
  },
  {
    name: "Name Withheld",
    title: "Global President",
    location: "Global Operations",
    isCeo: false,
  },
  {
    name: "Name Withheld",
    title: "Country Manager",
    location: "United States of America",
    isCeo: false,
  },
  {
    name: "Name Withheld",
    title: "Country Manager",
    location: "United Kingdom",
    isCeo: false,
  },
  {
    name: "Name Withheld",
    title: "Country Manager",
    location: "Canada",
    isCeo: false,
  },
  {
    name: "Name Withheld",
    title: "Country Manager",
    location: "Australia",
    isCeo: false,
  },
  {
    name: "Name Withheld",
    title: "Country Manager",
    location: "Nigeria",
    isCeo: false,
  },
];

const TeamSection = () => (
  <section id="team" className="py-28 bg-secondary/50">
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
          Leadership
        </motion.span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6">
          Our Leadership & <span className="text-primary">Global Team</span>
        </h2>
      </motion.div>

      {/* CEO — Featured Card */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto mb-16"
      >
        <div className="relative bg-card rounded-2xl border-2 border-primary/20 overflow-hidden shadow-lg group">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary to-accent" />
          <div className="p-8 flex flex-col sm:flex-row items-center gap-8">
            <div className="relative flex-shrink-0">
              <div className="w-36 h-36 rounded-2xl overflow-hidden ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
                <img
                  src={founderImg}
                  alt="Iregbu MichaelVasco"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
                <Crown size={14} className="text-primary-foreground" />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-2xl font-heading font-bold text-foreground">
                Iregbu MichaelVasco
              </h3>
              <p className="text-primary font-semibold mt-1">Founder, Chairman & CEO</p>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-3 text-muted-foreground text-sm">
                <MapPin size={14} />
                <span>San Francisco, CA</span>
              </div>
              <p className="text-muted-foreground text-sm mt-4 leading-relaxed max-w-md">
                Visionary technology leader, serial entrepreneur, and architect of Yaidev's global mission to democratize intelligent technology creation.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Other executives grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {executives.filter((e) => !e.isCeo).map(({ name, title, location }, i) => (
          <motion.div
            key={`${title}-${location}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="group bg-card rounded-xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-400"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors duration-300">
              {title === "Global President" ? (
                <Globe2 size={22} className="text-primary" />
              ) : (
                <User size={22} className="text-primary" />
              )}
            </div>
            <h4 className="font-heading font-bold text-foreground text-lg">{name}</h4>
            <p className="text-primary text-sm font-medium mt-1">{title}</p>
            <div className="flex items-center gap-1.5 mt-3 text-muted-foreground text-xs">
              <MapPin size={12} />
              <span>{location}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TeamSection;
