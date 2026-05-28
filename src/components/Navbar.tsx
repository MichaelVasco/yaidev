import { useState, useEffect } from "react";
import { Menu, X, Coins, LogIn, LayoutDashboard, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import yaidevLogo from "@/assets/yaidev-logo.jfif";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Home", hash: "home" },
  { label: "About", hash: "about" },
  { label: "Products", hash: "products" },
  { label: "Services", hash: "services" },
  { label: "Team", hash: "team" },
  { label: "Projects", hash: "projects" },
  { label: "Contact Us", hash: "contact" },
];

const Navbar = ({ onOpenBuilder }: { onOpenBuilder?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, credits, totalCoinsAvailable } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goToSection = (hash: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (location.pathname !== "/") {
      navigate(`/#${hash}`);
    } else {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      // keep URL hash in sync without full reload
      window.history.replaceState(null, "", `#${hash}`);
    }
  };

  const handleBuild = (e: React.MouseEvent) => {
    e.preventDefault(); setIsOpen(false);
    if (onOpenBuilder) { onOpenBuilder(); return; }
    if (location.pathname !== "/") { navigate("/?builder=1"); return; }
    document.querySelector("#build-now")?.scrollIntoView({ behavior: "smooth" });
  };

  const CoinBadge = () => (
    <Link to="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary/30 transition-all text-xs font-semibold text-foreground">
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-white/80 backdrop-blur-2xl border-b border-border shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#home" className="group flex items-center gap-2.5 shrink-0">
            <img src={yaidevLogo} alt="YAIDEV" className="h-9 sm:h-10 w-auto object-contain rounded-md transition-all duration-300 group-hover:drop-shadow-[0_0_10px_hsl(var(--color-blue)/0.4)]" />
            <span className="font-heading text-lg sm:text-xl font-bold tracking-tight text-gradient">YAIDEV</span>
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="relative px-4 py-2 rounded-lg text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-all duration-300 group">
                <span className="relative z-10">{item.label}</span>
                <span className="absolute inset-0 rounded-lg bg-primary/0 group-hover:bg-primary/8 transition-all" />
              </a>
            ))}

            {user ? (
              <div className="flex items-center gap-2 ml-2">
                <CoinBadge />
                <button onClick={() => navigate("/dashboard")} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Dashboard">
                  <LayoutDashboard size={16} />
                </button>
              </div>
            ) : (
              <Link to="/auth" className="ml-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold text-foreground border border-border hover:bg-muted transition-colors flex items-center gap-1.5">
                <LogIn size={14} /> Sign in
              </Link>
            )}

            <button onClick={handleBuild} className="relative ml-2 px-5 py-2 rounded-lg text-[13px] font-bold text-primary-foreground bg-primary hover:scale-[1.03] hover:shadow-lg hover:shadow-blue/20 transition-all">
              Build Now
            </button>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            {user && <CoinBadge />}
            <button onClick={() => setIsOpen(!isOpen)} className="p-3 -mr-1 rounded-lg text-foreground hover:bg-muted transition-colors" aria-label="Toggle menu" type="button">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="lg:hidden overflow-hidden bg-white/95 backdrop-blur-2xl border-b border-border">
            <div className="px-4 py-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} onClick={() => setIsOpen(false)}
                  className="block w-full px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-primary/8 transition-all">
                  {item.label}
                </a>
              ))}
              {user ? (
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block w-full px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-primary/10 flex items-center gap-2">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
              ) : (
                <Link to="/auth" onClick={() => setIsOpen(false)} className="block w-full px-4 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-primary/10 flex items-center gap-2">
                  <LogIn size={16} /> Sign in / Sign up
                </Link>
              )}
              <button onClick={handleBuild} className="mt-2 px-5 py-3.5 rounded-xl text-sm font-bold text-primary-foreground text-center bg-primary hover:shadow-lg hover:shadow-blue/20 transition-all">
                Build Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
