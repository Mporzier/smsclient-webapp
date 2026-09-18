export type ManualEnhanceMode = "improve" | "shorten" | "rephrase" | "correct";

export const MANUAL_ENHANCE_MODES: {
  value: ManualEnhanceMode;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    value: "improve",
    label: "Améliorer",
    emoji: "✨",
    description: "Clarté, tournures plus fluides et impact.",
  },
  {
    value: "shorten",
    label: "Raccourcir",
    emoji: "✂️",
    description: "Moins de mots, même message essentiel.",
  },
  {
    value: "rephrase",
    label: "Reformuler",
    emoji: "🔄",
    description: "Autres formulations, même intention.",
  },
  {
    value: "correct",
    label: "Corriger",
    emoji: "📝",
    description: "Orthographe, espaces et forme SMS.",
  },
];

export const DEFAULT_MANUAL_ENHANCE_MODE: ManualEnhanceMode = "improve";

export const DEFAULT_MANUAL_ENHANCE_MODES: ManualEnhanceMode[] = ["improve"];

/** Ordre d’application quand plusieurs modes sont cochés. */
const MANUAL_ENHANCE_APPLY_ORDER: ManualEnhanceMode[] = [
  "correct",
  "rephrase",
  "improve",
  "shorten",
];

export function applyManualEnhanceMany(
  body: string,
  modes: readonly ManualEnhanceMode[],
): string {
  if (modes.length === 0) return body.trim();
  let out = body;
  const selected = new Set(modes);
  for (const mode of MANUAL_ENHANCE_APPLY_ORDER) {
    if (selected.has(mode)) {
      out = applyManualEnhance(out, mode);
    }
  }
  return out;
}

function normalizeSmsForm(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/-(\d+)\s*%/g, "-$1 %")
    .replace(/\bonjour\b/gi, "Bonjour")
    .replace(/\bsms\b/gi, "SMS")
    .trim();
}

function rephraseCopy(text: string): string {
  return text
    .replace(/\bprofitez de\b/gi, "bénéficiez de")
    .replace(/\bcette semaine\b/gi, "en ce moment")
    .replace(/\bdans votre boulangerie\b/gi, "dans notre boutique")
    .replace(/\bn'hésitez pas\b/gi, "venez")
    .replace(/\btrès\b/gi, "vraiment")
    .trim();
}

function shortenCopy(text: string): string {
  let out = text
    .replace(/\b(en ce moment|actuellement|aujourd'hui)\b/gi, "")
    .replace(/\b(nous vous |vous )?invitons à\b/gi, "")
    .replace(/\bvenez\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
  if (out.length > 140) {
    out = out.slice(0, 137).trimEnd() + "…";
  }
  return out;
}

function improveCopy(text: string): string {
  const base = normalizeSmsForm(text);
  return rephraseCopy(base);
}

/** Proto — à remplacer par API IA. */
export function applyManualEnhance(
  body: string,
  mode: ManualEnhanceMode,
): string {
  const trimmed = body.trim();
  if (!trimmed) return trimmed;

  switch (mode) {
    case "correct":
      return normalizeSmsForm(trimmed);
    case "rephrase":
      return rephraseCopy(normalizeSmsForm(trimmed));
    case "shorten":
      return shortenCopy(normalizeSmsForm(trimmed));
    case "improve":
    default:
      return improveCopy(trimmed);
  }
}
