import { isAuthError } from "@supabase/supabase-js";

const GENERIC = "Une erreur est survenue. Réessaie.";
const LOGIN_INVALID_EMAIL = "Format d’e-mail invalide.";
const LOGIN_REQUIRED_EMAIL = "L’e-mail est requis.";
const LOGIN_REQUIRED_PASSWORD = "Le mot de passe est requis.";
const emailRx =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

type LoginValidationErrors = {
  emailError: string | null;
  passwordError: string | null;
};

/**
 * Texte d’erreur en français à partir d’une erreur API Supabase Auth.
 */
export function mapAuthErrorToFrench(err: unknown): string {
  if (isAuthError(err)) {
    return mapCodeAndMessage(err);
  }
  if (err instanceof Error) {
    return err.message;
  }
  return GENERIC;
}

/**
 * Validation locale du formulaire de connexion pour éviter les requêtes inutiles.
 */
export function getLoginValidationErrors(email: string, password: string): LoginValidationErrors {
  const trimmedEmail = email.trim();
  const emailError = !trimmedEmail
    ? LOGIN_REQUIRED_EMAIL
    : !emailRx.test(trimmedEmail)
      ? LOGIN_INVALID_EMAIL
      : null;
  const passwordError = password ? null : LOGIN_REQUIRED_PASSWORD;
  return { emailError, passwordError };
}

function mapCodeAndMessage({
  code,
  message,
  status,
}: {
  code?: string;
  message: string;
  status?: number;
}): string {
  if (code === "user_already_exists" || code === "email_exists") {
    return "Un compte existe déjà avec cette adresse e-mail.";
  }
  if (code === "email_not_confirmed" || code === "provider_email_needs_verification") {
    return "Confirme ton e-mail pour te connecter.";
  }
  if (code === "invalid_credentials" || (status === 400 && /invalid login credentials/i.test(message))) {
    return "E-mail ou mot de passe incorrect.";
  }
  if (code === "weak_password") {
    if (/length/i.test(message)) {
      return "Le mot de passe ne respecte pas la longueur requise.";
    }
    return "Le mot de passe est trop faible (lorsque des règles de complexité sont activées côté Supabase).";
  }
  if (code === "same_password" || (status === 422 && /Password/i.test(message))) {
    return "Choisis un autre mot de passe.";
  }
  if (code === "validation_failed" || (status === 400 && /password|email/i.test(message))) {
    return "Données invalides. Vérifie l’e-mail et le mot de passe.";
  }
  if (status && status >= 500) {
    return "Service temporairement indisponible. Réessaie plus tard.";
  }
  if (message && !/^AuthApiError|AuthError|NetworkError/i.test(message)) {
    return message;
  }
  return GENERIC;
}

/**
 * L’appel a échoué car l’e-mail n’est pas confirmé (connexion explicite).
 */
export function isEmailNotConfirmedError(err: unknown): boolean {
  return isAuthError(err) && err.code === "email_not_confirmed";
}
