import type {
  AutomationKind,
  AutomationRecurrenceUnit,
} from "@/lib/types/automation";

const WEEKDAY_LABELS = [
  "",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
] as const;

export type AutomationScheduleParts = {
  fixedMonth?: number | null;
  fixedDay?: number | null;
  recurrenceUnit?: AutomationRecurrenceUnit | null;
  recurrenceInterval?: number | null;
  recurrenceWeekday?: number | null;
};

export function automationScheduleLabel(
  kind: AutomationKind,
  parts: AutomationScheduleParts = {},
): string {
  const {
    fixedMonth,
    fixedDay,
    recurrenceUnit,
    recurrenceInterval,
    recurrenceWeekday,
  } = parts;

  if (kind === "birthday") {
    return "Chaque jour, à l'heure choisie, pour les contacts concernés";
  }

  if (kind === "fixed_date" && fixedMonth != null && fixedDay != null) {
    return `Chaque année le ${String(fixedDay).padStart(2, "0")}/${String(fixedMonth).padStart(2, "0")}`;
  }

  if (kind === "recurring" && recurrenceUnit) {
    const interval = recurrenceInterval ?? 1;
    if (recurrenceUnit === "weeks") {
      if (recurrenceWeekday != null && recurrenceWeekday >= 1 && recurrenceWeekday <= 7) {
        return `Chaque ${WEEKDAY_LABELS[recurrenceWeekday]}`;
      }
      return interval === 1 ? "Chaque semaine" : `Toutes les ${interval} semaines`;
    }
    if (recurrenceUnit === "days") {
      return interval === 1 ? "Tous les jours" : `Tous les ${interval} jours`;
    }
    if (recurrenceUnit === "months") {
      return interval === 1 ? "Tous les mois" : `Tous les ${interval} mois`;
    }
  }

  return "Planification par date";
}

export function automationKindDescription(kind: AutomationKind): string {
  if (kind === "birthday") {
    return "Envoie un SMS le jour de l'anniversaire des contacts éligibles.";
  }
  if (kind === "recurring") {
    return "Message automatique envoyé selon la récurrence choisie.";
  }
  return "Message automatique envoyé chaque année à la date choisie.";
}

export const AUTOMATION_WEEKDAY_OPTIONS = [
  { value: "1", label: "Lundi" },
  { value: "2", label: "Mardi" },
  { value: "3", label: "Mercredi" },
  { value: "4", label: "Jeudi" },
  { value: "5", label: "Vendredi" },
  { value: "6", label: "Samedi" },
  { value: "7", label: "Dimanche" },
] as const;
