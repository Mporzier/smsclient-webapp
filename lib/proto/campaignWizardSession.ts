const STEP_KEY = "smsclient.campaignWizard.step";

export type CampaignWizardStep = 1 | 2 | 3;

export function getStoredCampaignWizardStep(): CampaignWizardStep {
  if (typeof window === "undefined") return 1;
  const raw = sessionStorage.getItem(STEP_KEY);
  if (raw === "2") return 2;
  if (raw === "3") return 3;
  return 1;
}

export function setStoredCampaignWizardStep(step: CampaignWizardStep): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STEP_KEY, String(step));
}

export function clearCampaignWizardSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STEP_KEY);
}

export function resolveCampaignWizardStep(args: {
  storedStep: CampaignWizardStep;
  recipientCount: number;
  sms: string;
}): { step: CampaignWizardStep } {
  const canAccessStep2 = args.recipientCount > 0;
  const canAccessStep3 = canAccessStep2 && args.sms.trim().length > 0;

  if (args.storedStep >= 3 && !canAccessStep3) {
    return { step: 1 };
  }
  if (args.storedStep >= 2 && !canAccessStep2) {
    return { step: 1 };
  }
  return { step: args.storedStep };
}
