import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "yaidev_credits";
const VIP_KEY = "yaidev_vip";
const SUB_KEY = "yaidev_subscription";
const PENDING_KEY = "yaidev_pending_payment";
const VIP_EMAIL = "superstarmichaelvasco@gmail.com";
const DEFAULT_CREDITS = 20;

export type SubscriptionPlan = "monthly" | "yearly";
export type AccessStatus = "free" | "vip" | "subscribed" | "pending" | "locked";

export interface PendingPayment {
  fullName: string;
  email: string;
  plan: SubscriptionPlan;
  amount: string;
  reference: string;
  proofFileName: string;
  submittedAt: string;
}

function getCredits(): number {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) {
    localStorage.setItem(STORAGE_KEY, String(DEFAULT_CREDITS));
    return DEFAULT_CREDITS;
  }
  return parseInt(stored, 10);
}

function isVip(): boolean {
  return localStorage.getItem(VIP_KEY) === "true";
}

function isSubscribed(): boolean {
  return localStorage.getItem(SUB_KEY) === "true";
}

function getPendingPayment(): PendingPayment | null {
  const data = localStorage.getItem(PENDING_KEY);
  return data ? JSON.parse(data) : null;
}

export function useCredits() {
  const [credits, setCredits] = useState(getCredits);
  const [vip, setVip] = useState(isVip);
  const [subscribed, setSubscribed] = useState(isSubscribed);
  const [pending, setPending] = useState<PendingPayment | null>(getPendingPayment);

  // Sync state from storage on mount
  useEffect(() => {
    setCredits(getCredits());
    setVip(isVip());
    setSubscribed(isSubscribed());
    setPending(getPendingPayment());
  }, []);

  const accessStatus: AccessStatus = vip
    ? "vip"
    : subscribed
    ? "subscribed"
    : pending
    ? "pending"
    : credits > 0
    ? "free"
    : "locked";

  const canUse = vip || subscribed || credits > 0;

  const useCredit = useCallback(() => {
    if (vip || subscribed) return true;
    const current = getCredits();
    if (current <= 0) return false;
    const next = current - 1;
    localStorage.setItem(STORAGE_KEY, String(next));
    setCredits(next);
    return true;
  }, [vip, subscribed]);

  const activateVip = useCallback((email: string) => {
    if (email.toLowerCase().trim() === VIP_EMAIL) {
      localStorage.setItem(VIP_KEY, "true");
      setVip(true);
      return true;
    }
    return false;
  }, []);

  const submitPayment = useCallback((payment: PendingPayment) => {
    localStorage.setItem(PENDING_KEY, JSON.stringify(payment));
    setPending(payment);
  }, []);

  const grantAccess = useCallback(() => {
    localStorage.setItem(SUB_KEY, "true");
    localStorage.removeItem(PENDING_KEY);
    setSubscribed(true);
    setPending(null);
  }, []);

  return {
    credits,
    vip,
    subscribed,
    pending,
    accessStatus,
    canUse,
    useCredit,
    activateVip,
    submitPayment,
    grantAccess,
  };
}
