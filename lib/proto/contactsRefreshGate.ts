let paused = false;

export function pauseContactsRealtimeRefresh(): void {
  paused = true;
}

export function resumeContactsRealtimeRefresh(): void {
  paused = false;
}

export function isContactsRealtimeRefreshPaused(): boolean {
  return paused;
}
