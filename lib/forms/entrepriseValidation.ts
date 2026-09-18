import { isValidEmailFormat } from "@/lib/auth/validation";
import type { UserProfileForm } from "@/lib/types/profile";
import type { MessageKey } from "@/lib/i18n/messages";

function luhnCheck(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = Number.parseInt(digits[digits.length - 1 - i]!, 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export function normalizeSiretInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 14);
}

export function normalizeVatInput(value: string): string {
  return value.replace(/\s/g, "").toUpperCase().slice(0, 20);
}

export const BILLING_COUNTRY_STORED_VALUES = [
  "France",
  "Belgique",
  "Suisse",
] as const;

export type BillingCountryStoredValue =
  (typeof BILLING_COUNTRY_STORED_VALUES)[number];

export function normalizeBillingCountry(
  value: string,
): BillingCountryStoredValue | "" {
  const key = value.trim().toLowerCase();
  if (key === "france") return "France";
  if (key === "belgique" || key === "belgium") return "Belgique";
  if (key === "suisse" || key === "switzerland") return "Suisse";
  const trimmed = value.trim();
  if (
    (BILLING_COUNTRY_STORED_VALUES as readonly string[]).includes(trimmed)
  ) {
    return trimmed as BillingCountryStoredValue;
  }
  return "";
}

export function normalizePostalCodeInput(value: string, country: string): string {
  const trimmed = value.trim();
  const countryKey = country.trim().toLowerCase();
  if (countryKey === "france") {
    return trimmed.replace(/\D/g, "").slice(0, 5);
  }
  if (
    countryKey === "belgique" ||
    countryKey === "belgium" ||
    countryKey === "suisse" ||
    countryKey === "switzerland"
  ) {
    return trimmed.replace(/\D/g, "").slice(0, 4);
  }
  return trimmed.slice(0, 10);
}

export function validateSiret(value: string): boolean {
  const digits = normalizeSiretInput(value);
  if (!digits) return true;
  if (digits.length !== 14) return false;
  return luhnCheck(digits);
}

export function validateVatNumber(value: string): boolean {
  const normalized = normalizeVatInput(value);
  if (!normalized) return true;
  if (/^FR[A-HJ-NP-Z0-9]{2}\d{9}$/.test(normalized)) return true;
  if (/^[A-Z]{2}[A-Z0-9]{2,12}$/.test(normalized)) return true;
  return false;
}

export function validatePostalCode(value: string, country: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const countryKey = country.trim().toLowerCase();
  if (countryKey === "france") return /^\d{5}$/.test(trimmed);
  if (countryKey === "belgique" || countryKey === "belgium") {
    return /^\d{4}$/.test(trimmed);
  }
  if (countryKey === "suisse" || countryKey === "switzerland") {
    return /^\d{4}$/.test(trimmed);
  }
  return /^[A-Za-z0-9 -]{2,10}$/.test(trimmed);
}

export function validateBillingContact(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/\s/.test(trimmed)) return false;
  return isValidEmailFormat(trimmed);
}

export type EntrepriseFormField =
  | "companyName"
  | "businessActivity"
  | "siret"
  | "tva"
  | "address"
  | "zip"
  | "city"
  | "country"
  | "billingContact";

export function entrepriseFieldErrorKey(
  field: EntrepriseFormField,
  form: UserProfileForm,
): MessageKey | null {
  switch (field) {
    case "siret":
      return validateSiret(form.siret)
        ? null
        : "parametres.field.siretInvalid";
    case "tva":
      return validateVatNumber(form.tva) ? null : "parametres.field.tvaInvalid";
    case "zip":
      return validatePostalCode(form.zip, form.country)
        ? null
        : "parametres.field.zipInvalid";
    case "billingContact":
      return validateBillingContact(form.billingContact)
        ? null
        : "parametres.field.billingContactInvalid";
    default:
      return null;
  }
}

export function firstEntrepriseSubsectionErrorKey(
  fields: readonly (keyof UserProfileForm)[],
  form: UserProfileForm,
): MessageKey | null {
  for (const field of fields) {
    const error = entrepriseFieldErrorKey(field as EntrepriseFormField, form);
    if (error) return error;
  }
  return null;
}
