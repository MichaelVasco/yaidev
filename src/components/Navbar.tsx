import { useState, useEffect } from "react";
import { Menu, X, Coins, LogIn, LayoutDashboard, Crown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import yaidevLogo from "@/assets/yaidev-logo.jfif";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Contact", href: "/#contact" },
];

const Navbar = ({ onOpenBuilder }: { onOpenBuilder?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, credits, totalCoinsAvailable } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  const handleBuildClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    setIsOpen(false);
    if (user && onOpenBuilder) {
      event.preventDefault();
      onOpenBuilder();
    }
  };

  const buildHref = user ? "/?builder=1" : "/auth?redirect=/?builder=1";

  const CoinBadge = () => (
    <Link to="/dashboard" onClick={closeMenu} className="relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary/30 active:scale-95 transition-all text-xs font-semibold text-foreground touch-manipulation">
      {credits?.lifetime_unlimited ? (
        <><Crown size={12} className="text-blue" /> Unlimited</>
      ) : (
        <><Coins size={12} className="text-blue" /> {totalCoinsAvailable}</>
      )}
    </Link>
  );

  return (
    <motion.nav
      initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-[90] pointer-events-auto transition-all duration-500 ${
        scrolled ? "bg-white/80 backdrop-blur-2xl border-b border-border shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/#home" onClick={closeMenu} className="group relative z-10 flex items-center gap-2.5 shrink-0 touch-manipulation" aria-label="Go to YAIDEV home">
            <img src={yaidevLogo} alt="YAIDEV" className="h-9 sm:h-10 w-auto object-contain rounded-md transition-all duration-300 group-hover:drop-shadow-[0_0_10px_hsl(var(--color-blue)/0.4)]" />
            <span className="font-heading text-lg sm:text-xl font-bold tracking-tight text-gradient">YAIDEV</span>
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} onClick={closeMenu} className="relative px-4 py-2 rounded-lg text-[13px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-all duration-300 group touch-manipulation">
                <span className="relative z-10">{item.label}</span>
                <span className="absolute inset-0 rounded-lg bg-primary/0 group-hover:bg-primary/10 transition-all pointer-events-none" />
              </a>
            ))}

            {user ? (
              <div className="flex items-center gap-2 ml-2">
                <CoinBadge />
                <Link to="/dashboard" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-colors touch-manipulation" aria-label="Dashboard">
                  <LayoutDashboard size={16} />
                </Link>
              </div>
            ) : (
              <Link to="/auth" className="ml-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold text-foreground border border-border hover:bg-muted transition-colors flex items-center gap-1.5">
                <LogIn size={14} /> Sign in
              </Link>
            )}

            <a href={buildHref} onClick={handleBuildClick} className="relative ml-2 px-5 py-2 rounded-lg text-[13px] font-bold text-primary-foreground bg-primary hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-blue/20 transition-all touch-manipulation inline-flex items-center gap-1.5">
              <Sparkles size={14} />
              Build Now
            </a>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            {user && <CoinBadge />}
            <button onClick={() => setIsOpen((open) => !open)} className="relative z-10 p-3 -mr-1 rounded-lg text-foreground hover:bg-muted active:scale-95 transition-colors touch-manipulation" aria-label="Toggle menu" aria-expanded={isOpen} type="button">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            className="lg:hidden fixed left-0 right-0 top-16 bottom-0 bg-card/95 backdrop-blur-2xl border-t border-border overflow-y-auto">
            <div className="px-4 py-5 flex flex-col gap-1 min-h-full">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} onClick={closeMenu}
                  className="block w-full px-4 py-3.5 rounded-xl text-base font-semibold text-muted-foreground hover:text-foreground hover:bg-primary/10 active:scale-[0.99] transition-all touch-manipulation">
                  {item.label}
                </a>
              ))}
              {user ? (
                <Link to="/dashboard" onClick={closeMenu} className="w-full px-4 py-3.5 rounded-xl text-base font-semibold text-foreground hover:bg-primary/10 flex items-center gap-2 active:scale-[0.99] transition-all touch-manipulation">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
              ) : (
                <Link to="/auth" onClick={closeMenu} className="w-full px-4 py-3.5 rounded-xl text-base font-semibold text-foreground hover:bg-primary/10 flex items-center gap-2 active:scale-[0.99] transition-all touch-manipulation">
                  <LogIn size={16} /> Sign in / Sign up
                </Link>
              )}
              <a href={buildHref} onClick={handleBuildClick} className="mt-3 px-5 py-4 rounded-xl text-base font-bold text-primary-foreground text-center bg-primary hover:shadow-lg hover:shadow-blue/20 active:scale-[0.99] transition-all touch-manipulation flex items-center justify-center gap-2">
                <Sparkles size={16} />
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
