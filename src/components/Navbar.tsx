import { useEffect, useMemo, useState } from "react";
import { Menu, X, Coins, LogIn, LayoutDashboard, Crown, Sparkles } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();

  const buildHref = user ? "/?builder=1" : "/auth?redirect=/?builder=1";

  const scrollToTarget = (hash: string) => {
    const id = hash.replace("#", "");
    if (!id) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }

    let attempts = 0;
    const findAndScroll = () => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (attempts < 24) {
        attempts += 1;
        window.setTimeout(findAndScroll, 50);
      }
    };
    window.setTimeout(findAndScroll, 0);
  };

  const navigateWithFallback = (href: string) => {
    const url = new URL(href, window.location.origin);
    const targetPath = url.pathname || "/";
    const targetHash = url.hash;

    if (targetPath === "/" && targetHash) {
      navigate(`${targetPath}${targetHash}`);
      scrollToTarget(targetHash);
      return;
    }

    navigate(`${targetPath}${url.search}${targetHash}`);
  };

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

  const closeMenu = () => setIsOpen(false);

  const handleBuildClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (user && onOpenBuilder) {
      event.preventDefault();
      closeMenu();
      onOpenBuilder();
      return;
    }
    event.preventDefault();
    closeMenu();
    navigateWithFallback(buildHref);
  };

  const handleNavClick = (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    closeMenu();
    navigateWithFallback(href);
  };

  const navLinkClass = useMemo(
    () => "relative px-4 py-2 rounded-lg text-[13px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-all duration-200 group touch-manipulation cursor-pointer pointer-events-auto",
    [],
  );

  const CoinBadge = () => (
    <Link to="/dashboard" onClick={closeMenu} className="relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary/30 active:scale-95 transition-all text-xs font-semibold text-foreground touch-manipulation cursor-pointer pointer-events-auto">
      {credits?.lifetime_unlimited ? (
        <><Crown size={12} className="text-blue" /> Unlimited</>
      ) : (
        <><Coins size={12} className="text-blue" /> {totalCoinsAvailable}</>
      )}
    </Link>
  );

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[90] pointer-events-auto transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-2xl border-b border-border shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/#home" onClick={handleNavClick("/#home")} className="group relative z-10 flex items-center gap-2.5 shrink-0 touch-manipulation cursor-pointer pointer-events-auto" aria-label="Go to YAIDEV home">
            <img src={yaidevLogo} alt="YAIDEV" className="h-9 sm:h-10 w-auto object-contain rounded-md transition-all duration-300 group-hover:drop-shadow-[0_0_10px_hsl(var(--color-blue)/0.4)]" />
            <span className="font-heading text-lg sm:text-xl font-bold tracking-tight text-gradient">YAIDEV</span>
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} onClick={handleNavClick(item.href)} aria-current={location.hash && item.href.endsWith(location.hash) ? "page" : undefined} className={navLinkClass}>
                <span className="relative z-10">{item.label}</span>
                <span className="absolute inset-0 rounded-lg bg-primary/0 group-hover:bg-primary/10 transition-all pointer-events-none" />
              </a>
            ))}

            {user ? (
              <div className="flex items-center gap-2 ml-2">
                <CoinBadge />
                <Link to="/dashboard" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-colors touch-manipulation cursor-pointer pointer-events-auto" aria-label="Dashboard">
                  <LayoutDashboard size={16} />
                </Link>
              </div>
            ) : (
              <Link to="/auth" className="ml-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold text-foreground border border-border hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer pointer-events-auto touch-manipulation">
                <LogIn size={14} /> Sign in
              </Link>
            )}

            <a href={buildHref} onClick={handleBuildClick} className="relative ml-2 px-5 py-2 rounded-lg text-[13px] font-bold text-primary-foreground bg-primary hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-blue/20 transition-all touch-manipulation inline-flex items-center gap-1.5 cursor-pointer pointer-events-auto">
              <Sparkles size={14} />
              Build Now
            </a>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            {user && <CoinBadge />}
            <button onClick={() => setIsOpen((open) => !open)} className="relative z-10 p-3 -mr-1 rounded-lg text-foreground hover:bg-muted active:scale-95 transition-colors touch-manipulation cursor-pointer pointer-events-auto" aria-label="Toggle menu" aria-expanded={isOpen} type="button">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden fixed left-0 right-0 top-16 z-[89] bg-card/98 backdrop-blur-2xl border-t border-border shadow-xl pointer-events-auto">
          <nav className="px-4 py-5 flex flex-col gap-1" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} onClick={handleNavClick(item.href)}
                  className="block w-full px-4 py-3.5 rounded-xl text-base font-semibold text-muted-foreground hover:text-foreground hover:bg-primary/10 active:scale-[0.99] transition-all touch-manipulation cursor-pointer pointer-events-auto">
                  {item.label}
                </a>
              ))}
              {user ? (
                <Link to="/dashboard" onClick={closeMenu} className="w-full px-4 py-3.5 rounded-xl text-base font-semibold text-foreground hover:bg-primary/10 flex items-center gap-2 active:scale-[0.99] transition-all touch-manipulation cursor-pointer pointer-events-auto">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
              ) : (
                <Link to="/auth" onClick={closeMenu} className="w-full px-4 py-3.5 rounded-xl text-base font-semibold text-foreground hover:bg-primary/10 flex items-center gap-2 active:scale-[0.99] transition-all touch-manipulation cursor-pointer pointer-events-auto">
                  <LogIn size={16} /> Sign in / Sign up
                </Link>
              )}
              <a href={buildHref} onClick={handleBuildClick} className="mt-3 px-5 py-4 rounded-xl text-base font-bold text-primary-foreground text-center bg-primary hover:shadow-lg hover:shadow-blue/20 active:scale-[0.99] transition-all touch-manipulation flex items-center justify-center gap-2 cursor-pointer pointer-events-auto">
                <Sparkles size={16} />
                Build Now
              </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
