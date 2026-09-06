import { mapAuthErrorToFrench } from "@/lib/auth/authErrors";
import {
  clearPendingEmailChange,
  peekPendingEmailChange,
} from "@/lib/auth/pendingEmailChange";
import { createClient } from "@/lib/supabase/client";

export type AuthCallbackOutcome =
  | { kind: "email_changed" }
  | { kind: "password_recovery" }
  | { kind: "default" }
  | { kind: "error"; message: string };

function readCallbackType(): string | null {
  if (typeof window === "undefined") return null;
  const search = new URLSearchParams(window.location.search);
  const fromQuery = search.get("type");
  if (fromQuery) return fromQuery;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash || hash.includes("=")) {
    return new URLSearchParams(hash).get("type");
  }
  return null;
}

function hasAuthParams(): boolean {
  if (typeof window === "undefined") return false;
  const search = new URLSearchParams(window.location.search);
  if (search.get("code") || search.get("token_hash") || search.get("error")) {
    return true;
  }
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return false;
  const hashParams = new URLSearchParams(hash);
  return (
    hashParams.has("access_token") ||
    hashParams.has("code") ||
    hashParams.has("error")
  );
}

function stripAuthParamsFromUrl(): void {
  if (typeof window === "undefined") return;
  window.history.replaceState(null, "", window.location.pathname);
}

/** Échange le code/hash Supabase, valide changement email, logout global si besoin. */
export async function completeAuthCallback(): Promise<AuthCallbackOutcome> {
  if (!hasAuthParams()) {
    return { kind: "error", message: "Lien invalide ou expiré." };
  }

  const supabase = createClient();
  const callbackType = readCallbackType();
  const pendingEmail = peekPendingEmailChange();
  const search = new URLSearchParams(window.location.search);
  const code = search.get("code");
  const tokenHash = search.get("token_hash");
  const otpType = search.get("type");

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return { kind: "error", message: mapAuthErrorToFrench(error) };
      }
    } else if (tokenHash && otpType) {
      const { error } = await supabase.auth.verifyOtp({
        type: otpType as "email_change",
        token_hash: tokenHash,
      });
      if (error) {
        return { kind: "error", message: mapAuthErrorToFrench(error) };
      }
    } else {
      const { error } = await supabase.auth.getSession();
      if (error) {
        return { kind: "error", message: mapAuthErrorToFrench(error) };
      }
    }

    stripAuthParamsFromUrl();

    const isEmailChange =
      callbackType === "email_change" ||
      otpType === "email_change" ||
      pendingEmail !== null;

    if (isEmailChange) {
      clearPendingEmailChange();
      await supabase.auth.signOut({ scope: "global" });
      return { kind: "email_changed" };
    }

    const isPasswordRecovery =
      callbackType === "recovery" || otpType === "recovery";

    if (isPasswordRecovery) {
      return { kind: "password_recovery" };
    }

    return { kind: "default" };
  } catch (err) {
    return {
      kind: "error",
      message: mapAuthErrorToFrench(err),
    };
  }
}
