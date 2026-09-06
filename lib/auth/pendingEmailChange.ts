const STORAGE_KEY = "smsclient.pendingEmailChange";

export function markPendingEmailChange(email: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, email.trim().toLowerCase());
  } catch {
    /* ignore */
  }
}

export function peekPendingEmailChange(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearPendingEmailChange(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
