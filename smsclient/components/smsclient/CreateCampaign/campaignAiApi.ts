import type { SmsAiOptions } from "./SmsAiOptionCards";
import { ensureStopMention, generateAiVariants } from "./campaignTextUtils";

const MOCK_LATENCY_MS = 1400;

export type GenerateCampaignSmsInput = {
  prompt: string;
  campaignTitle: string;
  options: SmsAiOptions;
  linkUrl?: string;
};

function stripEmojis(text: string): string {
  return text.replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim();
}

/** Simule l'appel API de génération IA (à remplacer par l'API réelle). */
export async function generateCampaignSmsVariants(
  input: GenerateCampaignSmsInput,
): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

  const objective = input.prompt.trim() || input.campaignTitle.trim() || "offre boutique";
  const snippet = objective.slice(0, 48);

  let variants = generateAiVariants({
    objective: snippet,
    offer: `votre offre : ${snippet}`,
    duration: "48h",
    tone: "amical",
    includeFirstName: input.options.includeFirstName,
  });

  if (input.options.autoOptimize) {
    variants = variants.map((v) => ensureStopMention(v));
  }

  if (!input.options.allowSpecialChars) {
    variants = variants.map(stripEmojis);
  }

  if (input.options.linkTracking && input.linkUrl) {
    variants = variants.map((v) => `${v} ${input.linkUrl}`.trim());
  }

  return variants.slice(0, 3);
}
