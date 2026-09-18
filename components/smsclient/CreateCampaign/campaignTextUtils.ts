import { appendStopMention, hasStopMention } from "@/lib/proto/smsStopMention";
import { SMS_NOM_TAG, SMS_PRENOM_TAG } from "@/lib/proto/smsPersonalization";

export function formatDefaultCampaignDate(d = new Date()): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function buildDefaultCampaignTitle(d = new Date()): string {
  return `Campagne · ${formatDefaultCampaignDate(d)}`.slice(0, 80);
}

export function generateAiVariants(args: {
  objective: string;
  offer: string;
  duration: string;
  tone: string;
  mergeTokens?: string[];
}): string[] {
  const objective = args.objective.trim() || "offre boutique";
  const offer = args.offer.trim() || "une offre exclusive";
  const duration = args.duration.trim() || "48h";
  const tone = args.tone.trim().toLowerCase();
  const tokens = (args.mergeTokens ?? []).filter(Boolean);

  const greetBits = tokens.filter(
    (t) => t === SMS_PRENOM_TAG || t === SMS_NOM_TAG,
  );
  const extra = tokens.filter((t) => t !== SMS_PRENOM_TAG && t !== SMS_NOM_TAG);

  const opener = buildToneOpener(tone, greetBits);
  const greet = opener ? `${opener} ` : "";
  const extraBit = extra.length ? ` ${extra.join(" ")}` : "";

  const lines = buildToneVariantLines(tone, {
    greet,
    objective,
    offer,
    duration,
    extraBit,
  });

  return lines.map((x) => x.replace(/\s+/g, " ").trim().slice(0, 320));
}

function buildToneOpener(
  tone: string,
  greetBits: string[],
): string {
  const hasName = greetBits.length > 0;
  const names = greetBits.join(" ");

  switch (tone) {
    case "urgent":
    case "energetic":
      return hasName ? `${names},` : "";
    case "promo":
      return hasName ? `Bonjour ${names},` : "Bonjour,";
    case "premium":
      return hasName ? `Bonjour ${names},` : "Bonjour,";
    case "pro":
      return hasName ? `Bonjour ${names},` : "Bonjour,";
    case "festive":
      return hasName ? `Hello ${names} !` : "Hello !";
    case "direct":
      return hasName ? `${names},` : "";
    case "neutral":
      return hasName ? `Bonjour ${names},` : "Bonjour,";
    case "amical":
    default:
      return hasName ? `Bonjour ${names},` : "Hello,";
  }
}

function buildToneVariantLines(
  tone: string,
  ctx: {
    greet: string;
    objective: string;
    offer: string;
    duration: string;
    extraBit: string;
  },
): string[] {
  const { greet, objective, offer, duration, extraBit } = ctx;

  switch (tone) {
    case "urgent":
      return [
        `${greet}Dernières heures : ${objective} — ${offer}.${extraBit} Fin ${duration}.`,
        `${greet}${objective} : ${offer}.${extraBit} Plus que ${duration} !`,
        `${greet}Ne ratez pas : ${offer} pour ${objective}.${extraBit}`,
      ];
    case "promo":
      return [
        `${greet}Bon plan : ${objective} — ${offer}.${extraBit} Jusqu'à ${duration}.`,
        `${greet}${offer} sur ${objective}.${extraBit} Promo ${duration} !`,
        `${greet}Profitez de ${offer} : ${objective}.${extraBit}`,
      ];
    case "premium":
      return [
        `${greet}${objective} — ${offer}.${extraBit} Offre exclusive ${duration}.`,
        `${greet}Nous vous réservons ${offer} : ${objective}.${extraBit}`,
        `${greet}${objective}. ${offer}.${extraBit} Valable ${duration}.`,
      ];
    case "festive":
      return [
        `${greet}${objective} : ${offer} !${extraBit} Jusqu'au ${duration}.`,
        `${greet}C'est le moment : ${offer} pour ${objective}.${extraBit}`,
        `${greet}${objective} — ${offer}.${extraBit} Fêtez avec nous !`,
      ];
    case "pro":
      return [
        `${greet}${objective} : ${offer}.${extraBit} Valable ${duration}.`,
        `${greet}Information : ${offer} — ${objective}.${extraBit}`,
        `${greet}${objective}. ${offer}.${extraBit} Merci de votre confiance.`,
      ];
    case "direct":
      return [
        `${greet}${objective}. ${offer}.${extraBit} ${duration}.`,
        `${greet}${offer} — ${objective}.${extraBit}`,
        `${greet}${objective} : ${offer}.${extraBit} Fin ${duration}.`,
      ];
    case "energetic":
      return [
        `${greet}${objective} : ${offer} !${extraBit} Go — ${duration} !`,
        `${greet}C'est parti : ${offer} pour ${objective}.${extraBit}`,
        `${greet}${objective} — ${offer}.${extraBit} On vous attend !`,
      ];
    case "neutral":
      return [
        `${greet}${objective} : ${offer}.${extraBit} Valable ${duration}.`,
        `${greet}${offer} — ${objective}.${extraBit} Jusqu'au ${duration}.`,
        `${greet}${objective}. ${offer}.${extraBit}`,
      ];
    case "amical":
    default:
      return [
        `${greet}${objective} : ${offer}.${extraBit} Valable ${duration}.`,
        `${greet}profite de ${offer} pour ${objective}.${extraBit} Fin de l'offre dans ${duration}.`,
        `${objective} ${offer} pendant ${duration}.${extraBit} Passe en boutique avec ce SMS !`,
      ];
  }
}

export function normalizeUrl(url: string): string {
  const t = url.trim();
  if (!t) return "";
  if (!/^https?:\/\//i.test(t)) {
    return `https://${t}`;
  }
  return t;
}

export const SMS_LINK_LABEL_MAX_LENGTH = 60;
export const SMS_LINK_LABEL_MIN_LENGTH = 3;

export function isValidLinkLabel(label: string): boolean {
  const trimmed = label.trim();
  return (
    trimmed.length >= SMS_LINK_LABEL_MIN_LENGTH &&
    trimmed.length <= SMS_LINK_LABEL_MAX_LENGTH
  );
}

/** URL http(s) avec nom d'hôte plausible (domaine ou localhost). */
export function isValidLinkUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  const normalized = normalizeUrl(trimmed);
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const host = parsed.hostname;
    if (!host) return false;
    if (host === "localhost") return true;
    return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host);
  } catch {
    return false;
  }
}

/** Lien court prototype pour le suivi des clics (remplacé par l’API plus tard). */
export function minifyCampaignLink(url: string): string {
  const normalized = normalizeUrl(url);
  if (!normalized) return "";
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  const slug = hash.toString(36).slice(0, 7);
  return `https://l.sms.fm/${slug}`;
}

export function removeExistingUrl(text: string): string {
  return text.replace(/\s?https?:\/\/[^\s]+/gi, "").trim();
}

export function ensureStopMention(text: string): string {
  return hasStopMention(text) ? text.trim() : appendStopMention(text);
}

export { stripStopMention, hasStopMention, buildEffectiveSms, appendStopMention } from "@/lib/proto/smsStopMention";
