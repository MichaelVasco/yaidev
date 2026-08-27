import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, Crown, Sparkles, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import PaywallModal from "./PaywallModal";

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  onSearch?: (q: string) => void;
  searchPlaceholder?: string;
}

export default function ServiceLayout({ title, subtitle, icon, children, onSearch, searchPlaceholder }: Props) {
  const { user, loading, credits, subscription } = useAuth();
  const navigate = useNavigate();
  const [paywall, setPaywall] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
  }, [user, loading, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const coins = credits?.paid_balance ?? 0;
  const unlimited = !!credits?.lifetime_unlimited;
  const plan = subscription?.plan;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-card/80 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground shrink-0">
              <ArrowLeft size={16} /> <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <Link to="/" className="font-heading font-bold text-sm text-gradient hidden sm:inline">YAIDEV</Link>
          </div>
          <div className="flex items-center gap-2">
            {onSearch && (
              <div className="hidden md:flex items-center gap-1.5 px-3 h-9 rounded-full bg-muted/50 border border-border w-56">
                <Search size={14} className="text-muted-foreground" />
                <input
                  className="bg-transparent outline-none text-sm w-full"
                  placeholder={searchPlaceholder || "Search…"}
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
            )}
            <NotificationBell />
            <button
              onClick={() => setPaywall(true)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-card hover:border-blue/40 text-sm"
              title="Credits"
            >
              {unlimited ? (<><Crown size={14} className="text-blue" /><span className="font-medium text-blue">Unlimited</span></>)
                : plan ? (<><Sparkles size={14} className="text-purple" /><span className="font-medium text-purple capitalize">{plan}</span></>)
                : (<><Coins size={14} className={coins > 3 ? "text-blue" : "text-destructive"} /><span className={`font-semibold ${coins > 3 ? "text-foreground" : "text-destructive"}`}>{coins}</span></>)}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-6 max-w-6xl">
        <div className="mb-6 flex items-start gap-3">
          {icon && <div className="h-11 w-11 rounded-xl bg-blue/10 flex items-center justify-center text-blue">{icon}</div>}
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>

      <PaywallModal open={paywall} onClose={() => setPaywall(false)} />
    </div>
  );
}

// Small helpers reused by module pages.
export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`bg-card border border-border rounded-xl p-5 shadow-sm ${className}`}>{children}</div>
);
export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="font-heading font-semibold text-lg text-foreground mb-3">{children}</h2>
);
export const TabBar = <T extends string>({ tabs, value, onChange }: { tabs: { value: T; label: string; icon?: ReactNode }[]; value: T; onChange: (v: T) => void }) => (
  <div className="flex items-center gap-1 overflow-x-auto bg-card border border-border rounded-xl p-1 mb-5 no-scrollbar">
    {tabs.map(t => (
      <button
        key={t.value}
        onClick={() => onChange(t.value)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition ${value === t.value ? "bg-blue text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}
      >
        {t.icon}{t.label}
      </button>
    ))}
  </div>
);
