import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/** Extrait le code court depuis l’URL de la requête. */
function parseShortCode(reqUrl: string): string | null {
  const url = new URL(reqUrl);
  const segments = url.pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "";
  if (!last || last === "redirect-short-link") return null;
  if (!/^[a-z0-9]{4,32}$/i.test(last)) return null;
  return last;
}

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const code = parseShortCode(req.url);
  if (!code) {
    return new Response("Lien invalide", { status: 404 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: target, error } = await supabase.rpc("resolve_sms_short_link", {
    p_short_code: code,
  });

  const destination = typeof target === "string" ? target.trim() : "";
  if (error || !destination) {
    return new Response("Lien introuvable", { status: 404 });
  }

  // Attendre le tracking : sans await, l’isolate Edge se coupe avant la fin du RPC.
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { error: trackError } = await admin.rpc("track_sms_link_click", {
    p_short_code: code,
  });
  if (trackError) {
    console.error("track_sms_link_click:", trackError.message);
  }

  if (req.method === "HEAD") {
    return new Response(null, {
      status: 302,
      headers: { Location: destination },
    });
  }

  return Response.redirect(destination, 302);
});
