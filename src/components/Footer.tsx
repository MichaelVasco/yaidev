import { MessageCircle, Mail, Phone, Globe2, ArrowRight } from "lucide-react";

const footerLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Products", href: "#products" },
  { label: "Services", href: "#services" },
  { label: "Team", href: "#team" },
  { label: "Projects", href: "#projects" },
  { label: "Build Now", href: "#build-now" },
  { label: "Contact", href: "#contact" },
];

const Footer = () => (
  <footer className="relative bg-foreground overflow-hidden">
    {/* Subtle gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-foreground/80 pointer-events-none" />

    <div className="relative container mx-auto px-4 lg:px-8">
      {/* Top CTA bar */}
      <div className="py-10 border-b border-background/8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-heading text-2xl font-bold text-background">
            Ready to build something extraordinary?
          </h3>
          <p className="text-background/50 text-sm mt-1">Let's turn your vision into reality.</p>
        </div>
        <a
          href="#contact"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          Get Started <ArrowRight size={14} />
        </a>
      </div>

      {/* Main footer grid */}
      <div className="py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="lg:col-span-1">
          <h4 className="font-heading text-xl font-bold text-background mb-4 tracking-tight">YAIDEV</h4>
          <p className="text-background/45 text-sm leading-relaxed mb-6">
            A global technology corporation building intelligent digital solutions for businesses and individuals worldwide.
          </p>
          <div className="flex items-center gap-1">
            <Globe2 size={14} className="text-background/30" />
            <span className="text-background/30 text-xs">San Francisco, CA · Global Operations</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h5 className="font-heading font-semibold text-background text-sm mb-4 tracking-wide uppercase">Navigation</h5>
          <ul className="space-y-2.5">
            {footerLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-background/45 text-sm hover:text-background hover:translate-x-1 transition-all duration-200 inline-block">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Products */}
        <div>
          <h5 className="font-heading font-semibold text-background text-sm mb-4 tracking-wide uppercase">Products</h5>
          <ul className="space-y-2.5">
            {[
              { name: "AdsTVAI", href: "https://adstvai.lovable.app" },
              { name: "Paywithads", href: "https://paywithadspaymentgateway.lovable.app" },
              { name: "Yaiver", href: "https://yaiver.lovable.app" },
            ].map((p) => (
              <li key={p.name}>
                <a href={p.href} target="_blank" rel="noopener noreferrer" className="text-background/45 text-sm hover:text-background transition-colors inline-flex items-center gap-1">
                  {p.name} <ArrowRight size={10} className="opacity-0 group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h5 className="font-heading font-semibold text-background text-sm mb-4 tracking-wide uppercase">Contact</h5>
          <div className="space-y-3">
            <a href="tel:+2349047188353" className="flex items-center gap-3 text-background/45 text-sm hover:text-background transition-colors">
              <Phone size={14} /> +234 904 718 8353
            </a>
            <a href="mailto:superstarmichaelvasco@gmail.com" className="flex items-center gap-3 text-background/45 text-sm hover:text-background transition-colors">
              <Mail size={14} /> superstarmichaelvasco@gmail.com
            </a>
            <a href="https://wa.me/2349047188353?text=Good%20day%20Yaidev%2C%20I%20have%20an%20enquiry" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-background/45 text-sm hover:text-background transition-colors">
              <MessageCircle size={14} /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-background/8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-background/30 text-xs">
          © {new Date().getFullYear()} Yaidev Corporation. All rights reserved.
        </p>
        <p className="text-background/20 text-[10px] tracking-wider uppercase">
          San Francisco · Lagos · London · Toronto · Sydney
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
