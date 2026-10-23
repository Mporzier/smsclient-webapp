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

function publicOrigin(): string {
  return typeof window !== "undefined" ? window.location.origin : "";
}

function appBasePath(): string {
  return (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
}

/** URL inscription publique (parrainage `ref`). */
export function getAuthSignupUrl(referralCode?: string): string {
  const base = appBasePath();
  const path = base ? `${base}/auth/signup/` : "/auth/signup/";
  const q = referralCode?.trim()
    ? `ref=${encodeURIComponent(referralCode.trim())}`
    : "";
  const origin = publicOrigin();
  return q ? `${origin}${path}?${q}` : `${origin}${path}`;
}

/** Lien partageable affiché (mock `/parrainage/CODE`). */
export function getPublicReferralUrl(referralCode: string): string {
  const code = referralCode.trim().toUpperCase();
  const base = appBasePath();
  const path = base ? `${base}/parrainage/` : "/parrainage/";
  return `${publicOrigin()}${path}${encodeURIComponent(code)}`;
}

