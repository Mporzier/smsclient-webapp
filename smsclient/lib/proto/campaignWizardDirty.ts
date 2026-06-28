import type { SmsComposeApproach } from "@/components/smsclient/CreateCampaign/SmsComposeApproachCards";
import { sortedStringArraysEqual } from "@/components/smsclient/modals/modalFormGuard";
import type { CampaignWizardStep } from "@/lib/proto/campaignWizardSession";

export type CampaignWizardFormSnapshot = {
  step: CampaignWizardStep;
  title: string;
  sender: string;
  sms: string;
  sendMode: "now" | "sched";
  scheduleAt: string;
  recipientMode: "manual" | "lists" | "all" | "numbers";
  manualNumbers: string;
  selectedContactIds: string[];
  selectedGroupNames: string[];
  excludedContactIds: string[];
  composeApproach: SmsComposeApproach | null;
};

export function campaignWizardSnapshotsEqual(
  a: CampaignWizardFormSnapshot,
  b: CampaignWizardFormSnapshot,
): boolean {
  return (
    a.step === b.step &&
    a.title === b.title &&
    a.sender === b.sender &&
    a.sms === b.sms &&
    a.sendMode === b.sendMode &&
    a.scheduleAt === b.scheduleAt &&
    a.recipientMode === b.recipientMode &&
    a.manualNumbers === b.manualNumbers &&
    a.composeApproach === b.composeApproach &&
    sortedStringArraysEqual(a.selectedContactIds, b.selectedContactIds) &&
    sortedStringArraysEqual(a.selectedGroupNames, b.selectedGroupNames) &&
    sortedStringArraysEqual(a.excludedContactIds, b.excludedContactIds)
  );
}

export function isCampaignWizardDirty(
  current: CampaignWizardFormSnapshot,
  initial: CampaignWizardFormSnapshot,
): boolean {
  return !campaignWizardSnapshotsEqual(current, initial);
}
