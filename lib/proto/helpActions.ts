import {
  BookOpen,
  CircleHelp,
  Mail,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

export type HelpActionId = "center" | "faq" | "support" | "feedback";

export type HelpAction = {
  id: HelpActionId;
  icon: LucideIcon;
  onClick: () => void;
};

export const HELP_ACTIONS: HelpAction[] = [
  {
    id: "center",
    icon: BookOpen,
    onClick: () => {
      window.open("https://smsclient.fr/aide", "_blank", "noopener,noreferrer");
    },
  },
  {
    id: "faq",
    icon: CircleHelp,
    onClick: () => {
      window.open("https://smsclient.fr/faq", "_blank", "noopener,noreferrer");
    },
  },
  {
    id: "support",
    icon: Mail,
    onClick: () => {
      window.location.href =
        "mailto:support@smsclient.fr?subject=Aide%20SMSClient";
    },
  },
  {
    id: "feedback",
    icon: MessageCircle,
    onClick: () => {
      window.location.href =
        "mailto:support@smsclient.fr?subject=Retour%20SMSClient&body=Bonjour%2C%0A%0A";
    },
  },
];
