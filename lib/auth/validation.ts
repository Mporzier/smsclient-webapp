/** Règles alignées côté client (Supabase renvoie aussi `weak_password` côté serveur). */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

const LOCAL_PART_RX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const DOMAIN_LABEL_RX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

/** RFC 5322 simplifié — emails professionnels courants (facturation, auth). */
export function isValidEmailFormat(value: string): boolean {
  const email = value.trim();
  if (!email || email.length > 254) return false;

  const atIndex = email.indexOf("@");
  if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) return false;

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (!local || !domain || !LOCAL_PART_RX.test(local)) return false;
  if (!domain.includes(".")) return false;

  const labels = domain.split(".");
  return (
    labels.length >= 2 &&
    labels.every((label) => label.length > 0 && DOMAIN_LABEL_RX.test(label))
  );
}

export function validateSignupEmail(value: string): string | null {
  const t = value.trim();
  if (!t) {
    return "L’e-mail est requis.";
  }
  if (!isValidEmailFormat(t)) {
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
