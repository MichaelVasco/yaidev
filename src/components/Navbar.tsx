import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import yaidevLogo from "@/assets/yaidev-logo.jfif";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Products", href: "#products" },
  { label: "Services", href: "#services" },
  { label: "Team", href: "#team" },
  { label: "Projects", href: "#projects" },
  { label: "Contact Us", href: "#contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/60 backdrop-blur-2xl border-b border-primary/10 shadow-[0_1px_20px_hsl(var(--color-blue)/0.08),0_1px_3px_hsl(var(--color-purple)/0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#home" className="font-heading text-xl font-bold tracking-tight group">
            <span className="text-gradient transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(var(--color-blue)/0.5)]">
              YAIDEV
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="relative px-4 py-2 rounded-lg text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-all duration-300 group"
              >
                <span className="relative z-10">{item.label}</span>
                <span className="absolute inset-0 rounded-lg bg-primary/0 group-hover:bg-primary/8 transition-all duration-300" />
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] rounded-full bg-gradient-to-r from-primary to-accent group-hover:w-6 transition-all duration-300" />
              </a>
            ))}

            <a
              href="#build-now"
              className="relative ml-3 px-5 py-2 rounded-lg text-[13px] font-bold text-primary-foreground overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] hover:shadow-[0_0_20px_hsl(var(--color-blue)/0.3),0_0_40px_hsl(var(--color-purple)/0.15)]"
              style={{
                background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple)))",
              }}
            >
              <span className="relative z-10">Build Now</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
            </a>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden overflow-hidden bg-background/70 backdrop-blur-2xl border-b border-primary/10"
          >
            <div className="px-4 py-4 grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-primary/8 transition-all duration-300 text-center"
                >
                  {item.label}
                </a>
              ))}
              <a
                href="#build-now"
                onClick={() => setIsOpen(false)}
                className="col-span-2 mt-1 px-5 py-2.5 rounded-lg text-[13px] font-bold text-primary-foreground text-center hover:shadow-[0_0_20px_hsl(var(--color-blue)/0.3)]"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--color-blue)), hsl(var(--color-purple)))",
                }}
              >
                Build Now
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
