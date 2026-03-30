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
          ? "bg-white/80 backdrop-blur-2xl border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#home" className="group flex items-center gap-2.5 shrink-0">
            <img
              src={yaidevLogo}
              alt="YAIDEV"
              className="h-9 sm:h-10 w-auto object-contain rounded-md transition-all duration-300 group-hover:drop-shadow-[0_0_10px_hsl(var(--color-blue)/0.4)]"
            />
            <span className="font-heading text-lg sm:text-xl font-bold tracking-tight text-gradient transition-all duration-300">
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
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] rounded-full bg-primary group-hover:w-6 transition-all duration-300" />
              </a>
            ))}

            <a
              href="#build-now"
              className="relative ml-3 px-5 py-2 rounded-lg text-[13px] font-bold text-primary-foreground overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] hover:shadow-lg hover:shadow-blue/20 bg-primary"
            >
              <span className="relative z-10">Build Now</span>
            </a>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-3 -mr-1 rounded-lg text-foreground hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation"
            aria-label="Toggle menu"
            type="button"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
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
            className="lg:hidden overflow-hidden bg-white/95 backdrop-blur-2xl border-b border-border"
            style={{ position: "relative", zIndex: 9999 }}
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    const target = document.querySelector(item.href);
                    if (target) {
                      setTimeout(() => {
                        target.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }
                  }}
                  className="block w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-muted-foreground active:text-foreground active:bg-primary/10 hover:text-foreground hover:bg-primary/8 transition-all duration-200 text-left touch-manipulation"
                >
                  {item.label}
                </a>
              ))}
              <a
                href="#build-now"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  const target = document.querySelector("#build-now");
                  if (target) {
                    setTimeout(() => {
                      target.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }
                }}
                className="block w-full mt-2 px-5 py-3.5 rounded-xl text-sm font-bold text-primary-foreground text-center bg-primary hover:shadow-lg hover:shadow-blue/20 active:scale-[0.98] transition-all duration-200 touch-manipulation"
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
