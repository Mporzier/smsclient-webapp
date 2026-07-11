export type AutomationKind = "birthday" | "fixed_date";

export type AutomationPresetKey =
  | "birthday"
  | "saint_valentin"
  | "noel"
  | "nouvel_an"
  | "fete_des_meres";

/** Ligne affichée / éditée (fusion preset + base). */
export type AutomationRowData = {
  id: string | null;
  presetKey: AutomationPresetKey;
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
  persisted: boolean;
};

export type AutomationSavePayload = {
  presetKey: AutomationPresetKey;
  body: string;
  enabled: boolean;
  sendTime: string;
};
