// Centralized "Open AI Builder" flow — used by every entry point
// (Enter key in the homepage prompt box, "Open AI Builder" button, etc.)
// so the behavior is guaranteed identical across the app.

export const PENDING_PROMPT_KEY = "yaidev:pendingPrompt";

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
  try {
    sessionStorage.removeItem(PENDING_PROMPT_KEY);
  } catch {
    /* ignore */
  }
}

type NavigateFn = (to: string) => void;

/**
 * The single entry point every "Open AI Builder" trigger must call.
 *  - Persists the prompt so we can hydrate the Builder after auth redirects.
 *  - Sends unauthenticated users through /auth and returns them to the Builder.
 *  - Sends authenticated users to /?builder=1 which mounts <AiBuilder />.
 */
export function openAIBuilder(opts: {
  prompt?: string;
  user: unknown;
  navigate: NavigateFn;
}): void {
  const { prompt = "", user, navigate } = opts;
  savePendingPrompt(prompt);

  const target = "/?builder=1";
  if (!user) {
    navigate(`/auth?redirect=${encodeURIComponent(target)}`);
    return;
  }
  navigate(target);
}
