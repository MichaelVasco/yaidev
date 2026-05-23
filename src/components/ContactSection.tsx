import { motion } from "framer-motion";
import { Mail, Phone, MessageCircle, Send, MapPin } from "lucide-react";
import { useState } from "react";

const contactMethods = [
  {
    icon: Phone,
    label: "Phone",
    value: "+234 904 718 8353",
    href: "tel:+2349047188353",
    description: "Tap to call us directly",
  },
  {
    icon: Mail,
    label: "Email",
    value: "contact@yaidev.com",
    href: "mailto:contact@yaidev.com",
    description: "Send us an email",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+234 904 718 8353",
    href: "https://wa.me/2349047188353?text=Good%20day%20Yaidev%2C%20I%20have%20an%20enquiry",
    description: "Chat with us on WhatsApp",
  },
];

const ContactSection = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <section id="contact" className="py-28 section-divider" style={{ background: "linear-gradient(180deg, hsl(214 40% 96%), hsl(210 40% 98%))" }}>
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
            Get In Touch
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6">
            Contact <span className="text-gradient-cyan">Yaidev</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-10 max-w-5xl mx-auto">
          {/* Left — Contact methods */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 space-y-5"
          >
            {contactMethods.map(({ icon: Icon, label, value, href, description }, i) => (
              <motion.a
                key={label}
                href={href}
                target={label === "WhatsApp" ? "_blank" : undefined}
                rel={label === "WhatsApp" ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ x: 4 }}
                className="group flex items-start gap-4 bg-white rounded-xl border border-border p-5 hover:border-primary/20 hover:shadow-md hover:shadow-blue/5 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-lg bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                  <Icon size={20} className="text-primary transition-colors duration-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-heading font-semibold text-foreground">{label}</p>
                  <p className="text-primary text-sm font-medium truncate">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{description}</p>
                </div>
              </motion.a>
            ))}

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-4 bg-white rounded-xl border border-border p-5"
            >
              <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-heading font-semibold text-foreground">Headquarters</p>
                <p className="text-primary text-sm font-medium">San Francisco, CA</p>
                <p className="text-xs text-muted-foreground mt-1">United States of America</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right — Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-2xl border border-border p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <h3 className="font-heading font-bold text-foreground text-lg mb-1">Send Us a Message</h3>
              <p className="text-muted-foreground text-sm mb-6">We typically respond within 24 hours.</p>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Send size={24} className="text-primary" />
                  </div>
                  <h4 className="font-heading font-bold text-foreground text-lg">Message Sent!</h4>
                  <p className="text-muted-foreground text-sm mt-2">Thank you for reaching out. We'll get back to you shortly.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      type="text" placeholder="Your Name" required value={form.name} onChange={update("name")}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-sm transition-all"
                    />
                    <input
                      type="email" placeholder="Your Email" required value={form.email} onChange={update("email")}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-sm transition-all"
                    />
                  </div>
                  <input
                    type="text" placeholder="Subject" required value={form.subject} onChange={update("subject")}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-sm transition-all"
                  />
                  <textarea
                    placeholder="Your Message" rows={5} required value={form.message} onChange={update("message")}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-sm transition-all resize-none"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3 rounded-lg font-heading font-semibold text-sm text-white bg-primary transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue/20"
                  >
                    <Send size={16} />
                    Send Message
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
