// Compatibility shim — credits are now backed by the Supabase AuthContext.
// YAIDEV is paid-only: there are no free, daily or promotional coins.
import { useAuth } from "@/contexts/AuthContext";

export type AccessStatus = "anonymous" | "subscribed" | "lifetime" | "locked";

export function useCredits() {
  const { user, credits, subscription, canGenerate, totalCoinsAvailable, spendCredit, refreshCredits, refreshAll } = useAuth();

  const accessStatus: AccessStatus = !user
    ? "anonymous"
    : credits?.lifetime_unlimited
    ? "lifetime"
    : subscription && totalCoinsAvailable > 0
    ? "subscribed"
    : "locked";

  return {
    user,
    credits,
    subscription,
    accessStatus,
    canUse: canGenerate,
    coinsRemaining: credits?.lifetime_unlimited ? Infinity : totalCoinsAvailable,
    paidBalance: credits?.paid_balance ?? 0,
    totalUsed: credits?.total_used ?? 0,
    isLifetime: !!credits?.lifetime_unlimited,
    spendCredit,
    refreshCredits,
    refreshAll,
  };
}
