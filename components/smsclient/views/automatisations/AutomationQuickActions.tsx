"use client";

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

const cardCls =
  "group flex min-h-[168px] flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-[0_10px_22px_rgba(15,23,42,0.06)] transition-all hover:border-ring/40 hover:shadow-[0_14px_28px_rgba(15,23,42,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type QuickAction = {
  id: string;
  title: string;
  description: string;
  cta: string;
  emoji: string;
  emojiBg: string;
  onClick: () => void;
};

export type AutomationQuickActionsProps = {
  className?: string;
  onActivate: () => void;
  onCreate: () => void;
  onConnectTool: () => void;
};

export function AutomationQuickActions({
  className,
  onActivate,
  onCreate,
  onConnectTool,
}: AutomationQuickActionsProps) {
  const actions: QuickAction[] = [
    {
      id: "activate",
      title: "Activer une automatisation",
      description:
        "Choisissez parmi nos automatisations prêtes à l'emploi et activez-la en 1 clic.",
      cta: "Voir le catalogue",
      emoji: "🚀",
      emojiBg: "bg-emerald-100",
      onClick: onActivate,
    },
    {
      id: "create",
      title: "Créer une automatisation",
      description:
        "Créez une automatisation personnalisée adaptée à votre activité.",
      cta: "Créer maintenant",
      emoji: "➕",
      emojiBg: "bg-blue-100",
      onClick: onCreate,
    },
    {
      id: "connect",
      title: "Connecter un outil",
      description:
        "Connectez vos outils et déclenchez des automatisations synchronisées.",
      cta: "Voir les intégrations",
      emoji: "🔧",
      emojiBg: "bg-violet-100",
      onClick: onConnectTool,
    },
  ];

  return (
    <div className={cn("grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3", className)}>
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          className={cn(cardCls, "cursor-pointer")}
          onClick={action.onClick}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[2rem] leading-none select-none",
                action.emojiBg,
              )}
              aria-hidden
            >
              {action.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="m-0 text-base font-black leading-snug text-foreground">
                {action.title}
              </h3>
              <p className="m-0 mt-2 text-sm leading-relaxed text-muted-foreground">
                {action.description}
              </p>
            </div>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-ring group-hover:underline">
            {action.cta}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </button>
      ))}
    </div>
  );
}
