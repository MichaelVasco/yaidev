// Centralized "Open AI Builder" flow.
// Every entry point (Enter key on homepage, "Open AI Builder" button, Navbar CTA)
// funnels through the same confirm-then-navigate sequence.

export const PENDING_PROMPT_KEY = "yaidev:pendingPrompt";
export const BUILDER_CONFIRM_EVENT = "yaidev:builder-confirm";

export function savePendingPrompt(prompt: string): void {
  try {
    const trimmed = (prompt || "").trim();
    if (trimmed) sessionStorage.setItem(PENDING_PROMPT_KEY, trimmed);
    else sessionStorage.removeItem(PENDING_PROMPT_KEY);
  } catch {
    /* storage unavailable — safe to ignore */
  }
}

export function readPendingPrompt(): string {
  try {
    return sessionStorage.getItem(PENDING_PROMPT_KEY) || "";
  } catch {
    return "";
  }
}

export function clearPendingPrompt(): void {
  try { sessionStorage.removeItem(PENDING_PROMPT_KEY); } catch { /* ignore */ }
}

type NavigateFn = (to: string) => void;

/**
 * Show the "Ready To Build?" confirmation modal. On confirm the modal will
 * call `openAIBuilder` below with the same prompt.
 */
export function openAIBuilder(opts: {
  prompt?: string;
  user: unknown;
  navigate: NavigateFn;
  skipConfirm?: boolean;
}): void {
  const { prompt = "", user, navigate, skipConfirm = false } = opts;
  savePendingPrompt(prompt);

  if (!skipConfirm && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(BUILDER_CONFIRM_EVENT, { detail: { prompt } }));
    return;
  }

  const target = "/?builder=1";
  if (!user) {
    navigate(`/auth?redirect=${encodeURIComponent(target)}`);
    return;
  }
  navigate(target);
}
