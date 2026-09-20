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
      "Un SMS personnalisé part automatiquement le jour J pour chaque contact avec une date d'anniversaire — idéal pour fidéliser sans effort.",
    scheduleLabel: "Chaque jour, à l'heure choisie, pour les contacts concernés",
    defaultBody:
      "Joyeux anniversaire {prenom} ! 🎂 Toute l'équipe te souhaite une excellente journée.",
  },
  {
    key: "saint_valentin",
    kind: "fixed_date",
    name: "Saint-Valentin",
    description:
      "Touchez vos abonnés le 14 février avec un message chaleureux ou une offre duo — parfait pour boulangeries, fleuristes et commerces de proximité.",
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
    description:
      "Envoyez vos vœux de Noël le 24 décembre et rappellez vos horaires ou promotions de fin d'année en un seul envoi.",
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
    description:
      "Souhaitez une bonne année à toute votre base le 1er janvier — message court, impact fort pour repartir sur de bonnes bases.",
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
    description:
      "Anticipez la fête des mères avec un rappel ou une offre cadeau — fleuristes, restaurants et boutiques en profitent le plus.",
    scheduleLabel: "Fin mai (événement calendaire)",
    fixedMonth: 5,
    fixedDay: 31,
    defaultBody:
      "Bonne fête des mères {prenom} ! 💐 Une pensée chaleureuse pour vous.",
  },
  {
    key: "fete_des_peres",
    kind: "fixed_date",
    name: "Fête des pères",
    description:
      "Proposez une idée cadeau ou un moment à partager mi-juin : un SMS simple qui convertit sans campagne manuelle.",
    scheduleLabel: "Mi-juin (événement calendaire)",
    fixedMonth: 6,
    fixedDay: 21,
    defaultBody:
      "Bonne fête des pères {prenom} ! 🎁 Une pensée pour vous.",
  },
  {
    key: "paques",
    kind: "fixed_date",
    name: "Pâques",
    description:
      "Vœux de Pâques à vos clients abonnés — date indicative à ajuster selon le calendrier ; personnalisez le texte avant activation.",
    scheduleLabel: "Autour de Pâques (date indicative)",
    fixedMonth: 4,
    fixedDay: 20,
    defaultBody:
      "Joyeuses Pâques {prenom} ! 🐣 Toute l'équipe vous envoie ses vœux.",
  },
  {
    key: "rentree",
    kind: "fixed_date",
    name: "Rentrée",
    description:
      "Relancez vos clients début septembre : fournitures, mode, librairie ou offre rentrée — le bon timing pour un panier moyen plus haut.",
    scheduleLabel: "Début septembre",
    fixedMonth: 9,
    fixedDay: 1,
    defaultBody:
      "Bonne rentrée {prenom} ! 🎒 Passez une excellente reprise.",
  },
  {
    key: "halloween",
    kind: "fixed_date",
    name: "Halloween",
    description:
      "Animez votre point de vente le 31 octobre : offre flash, événement ou code promo — un coup de boost en pleine saison.",
    scheduleLabel: "Le 31 octobre",
    fixedMonth: 10,
    fixedDay: 31,
    defaultBody:
      "Happy Halloween {prenom} ! 🎃 Profitez de nos surprises du moment.",
  },
  {
    key: "toussaint",
    kind: "fixed_date",
    name: "Toussaint",
    description:
      "Un message sobre et attentionné le 1er novembre pour rester présent auprès de vos contacts sans ton commercial.",
    scheduleLabel: "Le 1er novembre",
    fixedMonth: 11,
    fixedDay: 1,
    defaultBody:
      "Bon Toussaint {prenom}. 🕯️ Pensées sincères de notre équipe.",
  },
];

export function presetByKey(key: AutomationPresetKey): AutomationPresetDef {
  const p = AUTOMATION_PRESETS.find((x) => x.key === key);
  if (!p) throw new Error(`Preset inconnu: ${key}`);
  return p;
}
