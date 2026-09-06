/**
 * URL de redirection des e-mails Supabase (confirmation, changement d'email).
 * Route dédiée — évite conflit avec le hash routing proto (#contacts, …).
 */
export function getEmailRedirectTo(): string {
  if (typeof window === "undefined") {
    return "/auth/callback/";
  }
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const path = base ? `${base}/auth/callback/` : "/auth/callback/";
  return `${window.location.origin}${path}`;
}

/** Chemin login avec query optionnelle (basePath GitHub Pages). */
export function getAuthLoginPath(query = ""): string {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const path = base ? `${base}/auth/login/` : "/auth/login/";
  return query ? `${path}?${query}` : path;
}
