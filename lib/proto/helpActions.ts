import {
  isOpenWidgetEnabled,
  openOpenWidget,
} from "@/lib/openwidget";
import {
  BookOpen,
  CircleHelp,
  Mail,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

export type HelpAction = {
  label: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
};

export const HELP_ACTIONS: HelpAction[] = [
  {
    label: "Centre d'aide",
    description: "Guides et tutoriels",
    icon: BookOpen,
    onClick: () => {
      if (openOpenWidget("faq")) return;
      window.open("https://smsclient.fr/aide", "_blank", "noopener,noreferrer");
    },
  },
  {
    label: "Foire aux questions",
    description: "Réponses aux questions fréquentes",
    icon: CircleHelp,
    onClick: () => {
      if (openOpenWidget("faq")) return;
      window.open("https://smsclient.fr/faq", "_blank", "noopener,noreferrer");
    },
  },
  {
    label: "Contacter le support",
    description: "support@smsclient.fr",
    icon: Mail,
    onClick: () => {
      if (openOpenWidget("form-contact")) return;
      window.location.href =
        "mailto:support@smsclient.fr?subject=Aide%20SMSClient";
    },
  },
  {
    label: "Donner un retour",
    description: "Suggérer une amélioration",
    icon: MessageCircle,
    onClick: () => {
      if (openOpenWidget("form-feedback")) return;
      window.location.href =
        "mailto:support@smsclient.fr?subject=Retour%20SMSClient&body=Bonjour%2C%0A%0A";
    },
  },
];

export { isOpenWidgetEnabled };
