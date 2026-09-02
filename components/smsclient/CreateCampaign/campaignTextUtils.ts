import { appendStopMention, hasStopMention } from "@/lib/proto/smsStopMention";
import { SMS_NOM_TAG, SMS_PRENOM_TAG } from "@/lib/proto/smsPersonalization";

export function buildDefaultCampaignTitle(): string {
  const d = new Date().toLocaleDateString("fr-FR");
  return `Campagne du ${d}`.slice(0, 80);
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

  const opener =
    greetBits.length > 0
      ? tone === "urgent"
        ? `${greetBits.join(" ")},`
        : `Bonjour ${greetBits.join(" ")},`
      : tone === "premium"
        ? "Bonjour,"
        : tone === "urgent"
          ? ""
          : "Hello,";

  const greet = opener ? `${opener} ` : "";
  const extraBit = extra.length ? ` ${extra.join(" ")}` : "";

  return [
    `${greet}${objective} : ${offer}.${extraBit} Valable ${duration}.`,
    `${greet}profite de ${offer} pour ${objective}.${extraBit} Fin de l'offre dans ${duration}.`,
    `${objective} ${offer} pendant ${duration}.${extraBit} Passe en boutique avec ce SMS !`,
  ].map((x) => x.replace(/\s+/g, " ").trim().slice(0, 320));
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
