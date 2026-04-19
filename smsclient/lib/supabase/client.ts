import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase pour le navigateur (composants client).
 * Compatible avec `output: "export"` (GitHub Pages) : pas de middleware serveur.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Variables manquantes : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return createBrowserClient(url, key);
}
