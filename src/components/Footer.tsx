const footerLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Products", href: "#products" },
  { label: "Services", href: "#services" },
  { label: "Team", href: "#team" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
];

const Footer = () => (
  <footer className="bg-foreground py-12">
    <div className="container mx-auto px-4">
      <div className="grid sm:grid-cols-3 gap-8 mb-8">
        <div>
          <h3 className="font-heading text-xl font-bold text-background mb-3">YAIDEV</h3>
          <p className="text-background/60 text-sm leading-relaxed">
            Building world-class technology solutions for businesses globally. Your vision, our innovation.
          </p>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-background mb-3">Quick Links</h4>
          <ul className="space-y-2">
            {footerLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-background/60 text-sm hover:text-background transition-colors">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-background mb-3">Contact</h4>
          <div className="space-y-2 text-background/60 text-sm">
            <p>contact@yaidev.com</p>
            <p>+234 800 000 0000</p>
            <p>Lagos, Nigeria</p>
          </div>
        </div>
      </div>
      <div className="border-t border-background/10 pt-6 text-center">
        <p className="text-background/40 text-sm">
          © {new Date().getFullYear()} YAIDEV. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
