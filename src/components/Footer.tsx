import { MessageCircle, Mail, Phone, Globe2, ArrowRight } from "lucide-react";
import yaidevLogo from "@/assets/yaidev-logo.jfif";

const footerLinks = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Contact", href: "/#contact" },
];

const Footer = () => (
  <footer className="relative bg-white border-t border-border overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-t from-secondary/30 to-transparent pointer-events-none" />

    <div className="relative container mx-auto px-4 lg:px-8">
      {/* Top CTA bar */}
      <div className="py-10 border-b border-border flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-heading text-2xl font-bold text-foreground">
            Ready to build something extraordinary?
          </h3>
          <p className="text-muted-foreground text-sm mt-1">Let's turn your vision into reality.</p>
        </div>
        <a
          href="/#contact"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-heading font-semibold text-sm bg-primary hover:shadow-lg hover:shadow-blue/20 transition-all duration-300"
        >
          Get Started <ArrowRight size={14} />
        </a>
      </div>

      {/* Main footer grid */}
      <div className="py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <img src={yaidevLogo} alt="YAIDEV" className="h-9 w-auto object-contain rounded-md" />
            <span className="font-heading text-xl font-bold tracking-tight text-gradient">YAIDEV</span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            A global technology corporation building intelligent digital solutions for businesses and individuals worldwide.
          </p>
          <div className="flex items-center gap-1">
            <Globe2 size={14} className="text-muted-foreground" />
            <span className="text-muted-foreground text-xs">San Francisco, CA · Global Operations</span>
          </div>
        </div>

        <div>
          <h5 className="font-heading font-semibold text-foreground text-sm mb-4 tracking-wide uppercase">Navigation</h5>
          <ul className="space-y-2.5">
            {footerLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-muted-foreground text-sm hover:text-primary hover:translate-x-1 transition-all duration-200 inline-block">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="font-heading font-semibold text-foreground text-sm mb-4 tracking-wide uppercase">Products</h5>
          <ul className="space-y-2.5">
            {[
              { name: "AdsTVAI", href: "https://adstvai.lovable.app" },
              { name: "Paywithads", href: "https://paywithadspaymentgateway.lovable.app" },
              { name: "Yaiver", href: "https://yaiver.lovable.app" },
            ].map((p) => (
              <li key={p.name}>
                <a href={p.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground text-sm hover:text-primary transition-colors inline-flex items-center gap-1">
                  {p.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="font-heading font-semibold text-foreground text-sm mb-4 tracking-wide uppercase">Contact</h5>
          <div className="space-y-3">
            <a href="tel:+2349047188353" className="flex items-center gap-3 text-muted-foreground text-sm hover:text-primary transition-colors">
              <Phone size={14} /> +234 904 718 8353
            </a>
            <a href="mailto:contact@yaidev.com" className="flex items-center gap-3 text-muted-foreground text-sm hover:text-primary transition-colors">
              <Mail size={14} /> contact@yaidev.com
            </a>
            <a href="https://wa.me/2349047188353?text=Good%20day%20Yaidev%2C%20I%20have%20an%20enquiry" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-muted-foreground text-sm hover:text-primary transition-colors">
              <MessageCircle size={14} /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()} Yaidev Corporation. All rights reserved.
        </p>
        <p className="text-muted-foreground/60 text-[10px] tracking-wider uppercase">
          San Francisco · Lagos · London · Toronto · Sydney
        </p>
      </div>

      {/* Faith Statement */}
      <div className="border-t border-border/50 py-6 text-center">
        <p className="text-muted-foreground/70 text-[11px] sm:text-xs leading-relaxed max-w-3xl mx-auto font-body">
          The God Of Chosen Is Fully In Charge Of This Technology, YAIDEV, In Jesus Christ Name. AMEN.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
