import { mapAuthErrorToFrench } from "@/lib/auth/authErrors";
import { getEmailRedirectTo } from "@/lib/auth/siteUrl";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateSignupPassword,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";
import { isAuthError } from "@supabase/supabase-js";

export type PasswordChangeField =
  | "current"
  | "new"
  | "confirm"
  | "form";

export type PasswordChangeErrorCode =
  | "current_required"
  | "current_invalid"
  | "new_required"
  | "new_invalid"
  | "confirm_required"
  | "confirm_mismatch"
  | "same_password"
  | "generic";

export type PasswordChangeResult =
  | { ok: true }
  | {
      ok: false;
      field: PasswordChangeField;
      code: PasswordChangeErrorCode;
    };

export type PasswordResetEmailResult =
  | { ok: true }
  | { ok: false; message: string };

function mapUpdatePasswordError(err: unknown): PasswordChangeResult {
  if (isAuthError(err)) {
    if (err.code === "same_password") {
      return { ok: false, field: "new", code: "same_password" };
    }
    if (err.code === "weak_password") {
      return { ok: false, field: "new", code: "new_invalid" };
    }
  }
  return { ok: false, field: "form", code: "generic" };
}

/** Re-auth puis nouveau mot de passe ; logout global après succès. */
export async function changePassword(input: {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<PasswordChangeResult> {
  const email = input.email.trim().toLowerCase();

  if (!input.currentPassword) {
    return { ok: false, field: "current", code: "current_required" };
  }
  if (!input.newPassword) {
    return { ok: false, field: "new", code: "new_required" };
  }
  if (validateSignupPassword(input.newPassword)) {
    return { ok: false, field: "new", code: "new_invalid" };
  }
  if (!input.confirmPassword) {
    return { ok: false, field: "confirm", code: "confirm_required" };
  }
  if (input.newPassword !== input.confirmPassword) {
    return { ok: false, field: "confirm", code: "confirm_mismatch" };
  }
  if (input.currentPassword === input.newPassword) {
    return { ok: false, field: "new", code: "same_password" };
  }

  const supabase = createClient();
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password: input.currentPassword,
  });
  if (authErr) {
    return { ok: false, field: "current", code: "current_invalid" };
  }

  const { error: updateErr } = await supabase.auth.updateUser({
    password: input.newPassword,
  });
  if (updateErr) return mapUpdatePasswordError(updateErr);

  await supabase.auth.signOut({ scope: "global" });
  return { ok: true };
}

/** Envoie un lien de réinitialisation à l'adresse du compte. */
export async function sendPasswordResetEmail(
  email: string,
): Promise<PasswordResetEmailResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: getEmailRedirectTo() },
  );
  if (error) {
    return { ok: false, message: mapAuthErrorToFrench(error) };
  }
  return { ok: true };
}

/** Mot de passe via lien recovery (session déjà établie). */
export async function completePasswordReset(input: {
  newPassword: string;
  confirmPassword: string;
}): Promise<PasswordChangeResult> {
  if (!input.newPassword) {
    return { ok: false, field: "new", code: "new_required" };
  }
  if (validateSignupPassword(input.newPassword)) {
    return { ok: false, field: "new", code: "new_invalid" };
  }
  if (!input.confirmPassword) {
    return { ok: false, field: "confirm", code: "confirm_required" };
  }
  if (input.newPassword !== input.confirmPassword) {
    return { ok: false, field: "confirm", code: "confirm_mismatch" };
  }

  const supabase = createClient();
  const { error: updateErr } = await supabase.auth.updateUser({
    password: input.newPassword,
  });
  if (updateErr) return mapUpdatePasswordError(updateErr);

  await supabase.auth.signOut({ scope: "global" });
  return { ok: true };
}

export { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH };
