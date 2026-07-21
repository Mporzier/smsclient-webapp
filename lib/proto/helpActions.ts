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
      if (openOpenWidget("faq")) return;
      window.open("https://smsclient.fr/aide", "_blank", "noopener,noreferrer");
    },
  },
  {
    id: "faq",
    icon: CircleHelp,
    onClick: () => {
      if (openOpenWidget("faq")) return;
      window.open("https://smsclient.fr/faq", "_blank", "noopener,noreferrer");
    },
  },
  {
    id: "support",
    icon: Mail,
    onClick: () => {
      if (openOpenWidget("form-contact")) return;
      window.location.href =
        "mailto:support@smsclient.fr?subject=Aide%20SMSClient";
    },
  },
  {
    id: "feedback",
    icon: MessageCircle,
    onClick: () => {
      if (openOpenWidget("form-feedback")) return;
      window.location.href =
        "mailto:support@smsclient.fr?subject=Retour%20SMSClient&body=Bonjour%2C%0A%0A";
    },
  },
];

export { isOpenWidgetEnabled };
