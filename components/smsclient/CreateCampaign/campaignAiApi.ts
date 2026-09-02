import { appendStopMention, stripStopMention } from "@/lib/proto/smsStopMention";
import type { SmsAiOptions } from "./SmsAiOptionCards";
import { generateAiVariants } from "./campaignTextUtils";
import { mergeTagToken } from "@/lib/proto/smsPersonalization";
import type { CustomFieldDef } from "@/lib/types/customFields";

const MOCK_LATENCY_MS = 1400;

export type GenerateCampaignSmsInput = {
  prompt: string;
  campaignTitle: string;
  options: SmsAiOptions;
  linkUrl?: string;
  customFieldDefs?: CustomFieldDef[];
};

function variantHasAllTokens(text: string, tokens: string[]): boolean {
  return tokens.every((token) => text.includes(token));
}

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

  const mergeTokens = input.options.selectedMergeTags
    .map((key) => mergeTagToken(key, input.customFieldDefs ?? []))
    .filter(Boolean);

  let variants = generateAiVariants({
    objective: snippet,
    offer: `votre offre : ${snippet}`,
    duration: "48h",
    tone: "amical",
    mergeTokens,
  }).filter((v) => variantHasAllTokens(v, mergeTokens));

  if (mergeTokens.length > 0 && variants.length === 0) {
    variants = generateAiVariants({
      objective: snippet,
      offer: `votre offre : ${snippet}`,
      duration: "48h",
      tone: "amical",
      mergeTokens,
    }).map((v) => `${mergeTokens.join(" ")} ${v}`.trim());
  }

  if (!input.options.allowSpecialChars) {
    variants = variants.map(stripEmojis);
  }

  if (input.options.linkTracking && input.linkUrl) {
    variants = variants.map((v) => `${v} ${input.linkUrl}`.trim());
  }

  return variants
    .slice(0, 3)
    .map((v) => appendStopMention(stripStopMention(v)));
}
