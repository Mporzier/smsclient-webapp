/**
 * URL de redirection des e-mails Supabase (clic de confirmation), avec `basePath` GitHub Pages.
 * À n’appeler que côté client (dépend de `window`).
 */
export function getEmailRedirectTo(): string {
  if (typeof window === "undefined") {
    return "/";
  }
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const path = base ? `${base}/` : "/";
  return `${window.location.origin}${path}`;
}
