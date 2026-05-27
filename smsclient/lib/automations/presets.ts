import type { AutomationKind, AutomationPresetKey } from "@/lib/types/automation";

export type AutomationPresetDef = {
  key: AutomationPresetKey;
  kind: AutomationKind;
  name: string;
  description: string;
  scheduleLabel: string;
  defaultBody: string;
  fixedMonth?: number;
  fixedDay?: number;
};

export const AUTOMATION_PRESETS: AutomationPresetDef[] = [
  {
    key: "birthday",
    kind: "birthday",
    name: "Anniversaires",
    description:
      "Envoie un SMS le jour de l'anniversaire des contacts qui ont une date renseignée.",
    scheduleLabel: "Chaque jour, à l'heure choisie, pour les contacts concernés",
    defaultBody:
      "Joyeux anniversaire {prenom} ! 🎂 Toute l'équipe te souhaite une excellente journée.",
  },
  {
    key: "saint_valentin",
    kind: "fixed_date",
    name: "Saint-Valentin",
    description: "Message automatique le 14 février à tous vos contacts abonnés.",
    scheduleLabel: "Le 14 février",
    fixedMonth: 2,
    fixedDay: 14,
    defaultBody:
      "Saint-Valentin : une pensée pour vous {prenom} 💝 Passez une belle journée !",
  },
  {
    key: "noel",
    kind: "fixed_date",
    name: "Noël",
    description: "Vœux de fin d'année envoyés le 24 décembre.",
    scheduleLabel: "Le 24 décembre",
    fixedMonth: 12,
    fixedDay: 24,
    defaultBody:
      "Joyeux Noël {prenom} ! 🎄 Meilleurs vœux de la part de toute l'équipe.",
  },
  {
    key: "nouvel_an",
    kind: "fixed_date",
    name: "Nouvel An",
    description: "SMS de vœux le 1er janvier.",
    scheduleLabel: "Le 1er janvier",
    fixedMonth: 1,
    fixedDay: 1,
    defaultBody:
      "Bonne année {prenom} ! 🎉 Tous nos vœux de bonheur et de réussite.",
  },
  {
    key: "fete_des_meres",
    kind: "fixed_date",
    name: "Fête des mères",
    description: "Message automatique fin mai (France, dernier dimanche).",
    scheduleLabel: "Fin mai (événement calendaire)",
    fixedMonth: 5,
    fixedDay: 31,
    defaultBody:
      "Bonne fête des mères {prenom} ! 💐 Une pensée chaleureuse pour vous.",
  },
];

export function presetByKey(key: AutomationPresetKey): AutomationPresetDef {
  const p = AUTOMATION_PRESETS.find((x) => x.key === key);
  if (!p) throw new Error(`Preset inconnu: ${key}`);
  return p;
}
