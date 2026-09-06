import { mapAuthErrorToFrench } from "@/lib/auth/authErrors";
import {
  clearPendingEmailChange,
  markPendingEmailChange,
} from "@/lib/auth/pendingEmailChange";
import { getEmailRedirectTo } from "@/lib/auth/siteUrl";
import { isValidEmailFormat } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";
import { isAuthError } from "@supabase/supabase-js";

export type EmailChangeField = "email" | "password";

export type EmailChangeErrorCode =
  | "email_required"
  | "email_invalid"
  | "email_same"
  | "email_exists"
  | "password_required"
  | "password_invalid"
  | "generic";

export type EmailChangeResult =
  | { ok: true; newEmail: string }
  | { ok: false; field: EmailChangeField | "form"; code: EmailChangeErrorCode };

function mapUpdateEmailError(err: unknown): EmailChangeResult {
  const message = err instanceof Error ? err.message : "";
  const code = isAuthError(err) ? err.code : undefined;
  if (
    code === "email_exists" ||
    code === "user_already_exists" ||
    code === "identity_already_exists" ||
    /already|exists|registered/i.test(message)
  ) {
    return { ok: false, field: "email", code: "email_exists" };
  }
  return { ok: false, field: "form", code: "generic" };
}

/** Re-auth mot de passe, puis demande de changement (email officiel après lien). */
export async function requestEmailChange(input: {
  currentEmail: string;
  newEmail: string;
  password: string;
}): Promise<EmailChangeResult> {
  const current = input.currentEmail.trim().toLowerCase();
  const next = input.newEmail.trim().toLowerCase();
  const password = input.password;

  if (!next) return { ok: false, field: "email", code: "email_required" };
  if (!isValidEmailFormat(next)) {
    return { ok: false, field: "email", code: "email_invalid" };
  }
  if (next === current) return { ok: false, field: "email", code: "email_same" };
  if (!password) {
    return { ok: false, field: "password", code: "password_required" };
  }

  const supabase = createClient();
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: current,
    password,
  });
  if (authErr) {
    return { ok: false, field: "password", code: "password_invalid" };
  }

  const { error: updateErr } = await supabase.auth.updateUser(
    { email: next },
    { emailRedirectTo: getEmailRedirectTo() },
  );
  if (updateErr) return mapUpdateEmailError(updateErr);

  markPendingEmailChange(next);
  return { ok: true, newEmail: next };
}

export type EmailChangeActionResult =
  | { ok: true }
  | { ok: false; message: string };

/** Renvoie le lien de confirmation vers la nouvelle adresse en attente. */
export async function resendPendingEmailChange(
  pendingEmail: string,
): Promise<EmailChangeActionResult> {
  const email = pendingEmail.trim().toLowerCase();
  const supabase = createClient();
  const redirectTo = getEmailRedirectTo();

  const { error: resendErr } = await supabase.auth.resend({
    type: "email_change",
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (!resendErr) {
    markPendingEmailChange(email);
    return { ok: true };
  }

  const { error: updateErr } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: redirectTo },
  );
  if (updateErr) {
    return { ok: false, message: mapAuthErrorToFrench(updateErr) };
  }

  markPendingEmailChange(email);
  return { ok: true };
}

/** Annule la demande de changement d'adresse en attente. */
export async function cancelPendingEmailChange(
  currentEmail: string,
): Promise<EmailChangeActionResult> {
  const email = currentEmail.trim().toLowerCase();
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ email });
  if (error) {
    return { ok: false, message: mapAuthErrorToFrench(error) };
  }
  clearPendingEmailChange();
  return { ok: true };
}
