/** Soft-delete retention before hard purge (must match SQL purge_expired_trash). */
export const TRASH_RETENTION_DAYS = 30;

export function trashPurgeAtIso(deletedAtIso: string): string {
  const d = new Date(deletedAtIso);
  d.setTime(d.getTime() + TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  return d.toISOString();
}
