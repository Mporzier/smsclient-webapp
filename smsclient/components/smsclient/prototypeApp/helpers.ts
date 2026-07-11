import { plusTenMinutesParis } from "@/lib/proto/timezone";

export function plusTenMinutesLocalValue() {
  return plusTenMinutesParis();
}

export function defaultCampaignTitle() {
  return `Campagne du ${new Date().toLocaleDateString("fr-FR")}`;
}

export function parseManualNumbers(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}
