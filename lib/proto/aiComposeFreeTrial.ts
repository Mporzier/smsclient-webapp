const STORAGE_KEY = "smsclient-ai-compose-free-trial-date";

function todayParisDateKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
  }).format(new Date());
}

export function isAiComposeFreeTrialUsedToday(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === todayParisDateKey();
  } catch {
    return false;
  }
}

export function markAiComposeFreeTrialUsedToday(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, todayParisDateKey());
  } catch {
    /* ignore quota / private mode */
  }
}
