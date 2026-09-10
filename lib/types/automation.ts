export type AutomationKind = "birthday" | "fixed_date" | "recurring";

export type AutomationRecurrenceUnit = "days" | "weeks" | "months";

export type AutomationPresetKey =
  | "birthday"
  | "saint_valentin"
  | "noel"
  | "nouvel_an"
  | "fete_des_meres";

/** Ligne affichée / éditée (fusion preset + base). */
export type AutomationRowData = {
  id: string | null;
  presetKey: AutomationPresetKey | null;
  kind: AutomationKind;
  name: string;
  description: string;
  scheduleLabel: string;
  body: string;
  enabled: boolean;
  /** HH:MM */
  sendTime: string;
  fixedMonth?: number;
  fixedDay?: number;
  recurrenceUnit?: AutomationRecurrenceUnit;
  recurrenceInterval?: number;
  /** 1 = lundi … 7 = dimanche (ISO). */
  recurrenceWeekday?: number;
  persisted: boolean;
};

export type AutomationPresetSavePayload = {
  mode: "preset";
  presetKey: AutomationPresetKey;
  body: string;
  enabled: boolean;
  sendTime: string;
};

export type AutomationCustomSavePayload = {
  mode: "custom";
  name: string;
  kind: "fixed_date" | "recurring";
  body: string;
  enabled: boolean;
  sendTime: string;
  fixedMonth?: number;
  fixedDay?: number;
  recurrenceUnit?: AutomationRecurrenceUnit;
  recurrenceInterval?: number;
  recurrenceWeekday?: number;
  id?: string;
};

export type AutomationSavePayload =
  | AutomationPresetSavePayload
  | AutomationCustomSavePayload;

export const AUTOMATION_NAME_MIN_LENGTH = 3;
export const AUTOMATION_NAME_MAX_LENGTH = 60;
