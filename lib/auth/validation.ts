/** Règles alignées côté client (Supabase renvoie aussi `weak_password` côté serveur). */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

const emailRx =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function validateSignupEmail(value: string): string | null {
  const t = value.trim();
  if (!t) {
    return "L’e-mail est requis.";
  }
  if (!emailRx.test(t)) {
    return "Format d’e-mail invalide.";
  }
  return null;
}

/**
 * Longueur + au moins une lettre (latin) et un chiffre, pour un mot de passe exploitable.
 */
export function validateSignupPassword(value: string): string | null {
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return "Le mot de passe est trop long (maximum 72 caractères).";
  }
  if (!/[a-zA-Z\u00C0-\u024F]/.test(value) || !/\d/.test(value)) {
    return "Le mot de passe doit inclure au moins une lettre et un chiffre.";
  }
  return null;
}
