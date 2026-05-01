import type { Dispatch, SetStateAction } from "react";
import type { ContactRowData } from "@/lib/types/contact";
import type { GroupRowData } from "@/lib/types/group";

export type CampaignWizardProps = {
  step: 1 | 2 | 3 | 4 | 5;
  go: (h: string) => void;
  title: string;
  setTitle: (v: string) => void;
  sender: string;
  setSender: (v: string) => void;
  sms: string;
  setSms: (v: string) => void;
  sendMode: "now" | "sched";
  setSendMode: (v: "now" | "sched") => void;
  scheduleAt: string;
  setScheduleAt: (v: string) => void;
  aiOpen: boolean;
  setAiOpen: (v: boolean) => void;
  goalPreset: "promotion" | "relance" | "nouveaute" | "fidelisation" | "libre";
  setGoalPreset: (
    v: "promotion" | "relance" | "nouveaute" | "fidelisation" | "libre",
  ) => void;
  goalFreeText: string;
  setGoalFreeText: (v: string) => void;
  groups: GroupRowData[];
  contacts: ContactRowData[];
  recipientMode: "manual" | "lists" | "all" | "numbers";
  setRecipientMode: (v: "manual" | "lists" | "all" | "numbers") => void;
  manualNumbers: string;
  setManualNumbers: (v: string) => void;
  selectedGroupNames: string[];
  setSelectedGroupNames: Dispatch<SetStateAction<string[]>>;
  selectedContactIds: string[];
  setSelectedContactIds: Dispatch<SetStateAction<string[]>>;
  recipientSelectedRaw: number;
  recipientExcludedStop: number;
  recipientExcludedInvalid: number;
  recipientCount: number;
  creditsAvailable: number;
  /** Étape 5 : enregistrement en base puis retour liste. */
  onConfirmCampaign?: () => void | Promise<void>;
};
