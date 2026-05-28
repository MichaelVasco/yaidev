// Compatibility shim — credits are now backed by the Supabase AuthContext.
// Older components keep importing this hook; it forwards to the new system.
import { useAuth } from "@/contexts/AuthContext";

export type AccessStatus = "anonymous" | "free" | "subscribed" | "lifetime" | "locked";

export function useCredits() {
  const { user, credits, subscription, canGenerate, totalCoinsAvailable, spendCredit, refreshCredits } = useAuth();

  const accessStatus: AccessStatus = !user
    ? "anonymous"
    : credits?.lifetime_unlimited
    ? "lifetime"
    : subscription
    ? "subscribed"
    : totalCoinsAvailable > 0
    ? "free"
    : "locked";

  return {
    user,
    credits,
    subscription,
    accessStatus,
    canUse: canGenerate,
    coinsRemaining: credits?.lifetime_unlimited ? Infinity : totalCoinsAvailable,
    dailyFreeRemaining: credits?.daily_free_remaining ?? 0,
    paidBalance: credits?.paid_balance ?? 0,
    isLifetime: !!credits?.lifetime_unlimited,
    spendCredit,
    refreshCredits,
  };
}
