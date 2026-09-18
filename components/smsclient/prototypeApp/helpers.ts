import { buildDefaultCampaignTitle } from "@/components/smsclient/CreateCampaign/campaignTextUtils";
import { plusTenMinutesParis } from "@/lib/proto/timezone";

export function plusTenMinutesLocalValue() {
  return plusTenMinutesParis();
}

export function defaultCampaignTitle() {
  return buildDefaultCampaignTitle();
}

export function parseManualNumbers(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}
