import { createBrowserClient } from "@supabase/ssr";

/**
 * True quand les variables sont définies (build CI / .env.local / secrets GitHub).
 * Sans ça, l’auth ne peut pas fonctionner en ligne même si le build réussit.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

/**
 * Client Supabase pour le navigateur (composants client).
 * Compatible avec `output: 'export'` (GitHub Pages) : pas de middleware serveur.
 *
 * Ne lance pas d’erreur si les variables manquent : nécessaire pour `next build`
 * (prérendu sans `.env`). Dans ce cas on utilise un client factice : le build passe,
 * mais il faut configurer les secrets GitHub pour que l’auth marche en prod.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (url && key) {
    return createBrowserClient(url, key);
  }
  return createBrowserClient(
    "https://placeholder.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.E-build-without-supabase-env",
  );
}
