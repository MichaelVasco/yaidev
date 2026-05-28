import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface Credits {
  daily_free_remaining: number;
  daily_reset_at: string;
  paid_balance: number;
  lifetime_unlimited: boolean;
  total_used: number;
}

export interface Subscription {
  id: string;
  plan: "pro" | "enterprise" | "forever";
  status: "active" | "cancelled" | "expired";
  expires_at: string | null;
  coins_granted: number;
  started_at: string;
}

interface AuthCtx {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  credits: Credits | null;
  subscription: Subscription | null;
  loading: boolean;
  refreshCredits: () => Promise<void>;
  refreshAll: () => Promise<void>;
  signOut: () => Promise<void>;
  spendCredit: () => Promise<{ ok: boolean; error?: string }>;
  canGenerate: boolean;
  totalCoinsAvailable: number;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfileAndCredits = useCallback(async (uid: string) => {
    const [{ data: p }, { data: c }, { data: subs }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email, avatar_url").eq("user_id", uid).maybeSingle(),
      supabase.from("user_credits").select("daily_free_remaining, daily_reset_at, paid_balance, lifetime_unlimited, total_used").eq("user_id", uid).maybeSingle(),
      supabase.from("subscriptions").select("id, plan, status, expires_at, coins_granted, started_at").eq("user_id", uid).eq("status", "active").order("started_at", { ascending: false }).limit(1),
    ]);
    setProfile(p as Profile | null);
    setCredits(c as Credits | null);
    setSubscription((subs && subs[0]) ? (subs[0] as Subscription) : null);
  }, []);

  useEffect(() => {
    // Subscribe FIRST, then check existing session
    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // Defer DB calls to avoid potential deadlocks in the listener
        setTimeout(() => { loadProfileAndCredits(newSession.user.id); }, 0);
      } else {
        setProfile(null); setCredits(null); setSubscription(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadProfileAndCredits(s.user.id);
      setLoading(false);
    });

    return () => sub.unsubscribe();
  }, [loadProfileAndCredits]);

  const refreshCredits = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("user_credits")
      .select("daily_free_remaining, daily_reset_at, paid_balance, lifetime_unlimited, total_used")
      .eq("user_id", user.id).maybeSingle();
    setCredits(data as Credits | null);
  }, [user]);

  const refreshAll = useCallback(async () => {
    if (!user) return;
    await loadProfileAndCredits(user.id);
  }, [user, loadProfileAndCredits]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null); setCredits(null); setSubscription(null);
  }, []);

  const spendCredit = useCallback(async () => {
    if (!user) return { ok: false, error: "not_authenticated" };
    const { data, error } = await supabase.rpc("spend_credit", { _user_id: user.id });
    if (error) return { ok: false, error: error.message };
    const result = data as any;
    await refreshCredits();
    return { ok: !!result?.ok, error: result?.error };
  }, [user, refreshCredits]);

  const totalCoinsAvailable = credits
    ? (credits.lifetime_unlimited ? Infinity : credits.daily_free_remaining + credits.paid_balance)
    : 0;

  const canGenerate = !!user && (credits?.lifetime_unlimited || totalCoinsAvailable > 0);

  return (
    <AuthContext.Provider
      value={{
        session, user, profile, credits, subscription, loading,
        refreshCredits, refreshAll, signOut, spendCredit,
        canGenerate, totalCoinsAvailable,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
