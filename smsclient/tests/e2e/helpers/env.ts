export type E2ECredentials = {
  email: string;
  password: string;
};

/** Identifiants compte de test (optionnels en local / CI). */
export function getE2ECredentials(): E2ECredentials | null {
  const email = process.env.E2E_USER_EMAIL?.trim();
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

export function hasE2ECredentials(): boolean {
  return getE2ECredentials() != null;
}

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}
