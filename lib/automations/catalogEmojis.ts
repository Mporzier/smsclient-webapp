import {
  automationNormalizedTags,
  primaryTagForDisplay,
  type CatalogAutomation,
} from "@/lib/automations/catalog";

const PRESET_EMOJI: Record<string, string> = {
  birthday: "🎂",
  saint_valentin: "💝",
  noel: "🎄",
  nouvel_an: "🎊",
  fete_des_meres: "💐",
  fete_des_peres: "🎁",
  paques: "🐣",
  rentree: "🎒",
  halloween: "🎃",
  toussaint: "🕯️",
};

const TAG_EMOJI: Record<string, string> = {
  calendrier: "📅",
  fidelisation: "💎",
  promo: "🏷️",
};

const KIND_EMOJI: Record<string, string> = {
  birthday: "🎂",
  fixed_date: "📆",
  recurring: "🔁",
  schedule: "⏰",
  manual_or_schedule: "✨",
};

export function catalogAutomationEmoji(automation: CatalogAutomation): string {
  const preset = PRESET_EMOJI[automation.id];
  if (preset) return preset;

  const tag = primaryTagForDisplay(automation);
  if (tag && TAG_EMOJI[tag]) return TAG_EMOJI[tag];

  for (const t of automationNormalizedTags(automation)) {
    if (TAG_EMOJI[t]) return TAG_EMOJI[t];
  }

  if (automation.kind && KIND_EMOJI[automation.kind]) {
    return KIND_EMOJI[automation.kind];
  }

  return "⚡";
}

export function catalogTagEmoji(tag: string): string {
  return TAG_EMOJI[tag] ?? "✨";
}

export function automationPresetEmoji(
  presetKey: string | null | undefined,
): string {
  if (presetKey && PRESET_EMOJI[presetKey]) return PRESET_EMOJI[presetKey];
  return "⚡";
}
