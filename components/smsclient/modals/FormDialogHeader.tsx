"use client";

import {
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { modalIconCls } from "./modalChrome";

type FormDialogHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Pas de cadre `.modal-icon` (ex. drapeau, avatar custom) */
  bareIcon?: boolean;
  /** Classes titre (ex. font-black legacy) */
  titleClassName?: string;
  descriptionClassName?: string;
  className?: string;
};

/**
 * Header modale formulaire — laisse `pr-8` pour la croix DialogContent
 * (`showCloseButton`). Ne jamais ajouter de bouton X custom ici.
 */
export function FormDialogHeader({
  title,
  description,
  icon,
  bareIcon = false,
  titleClassName,
  descriptionClassName,
  className,
}: FormDialogHeaderProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2.5 border-b border-border px-4 py-2.5",
        className,
      )}
    >
      {icon != null ? (
        bareIcon ? (
          <div className="shrink-0" aria-hidden>
            {icon}
          </div>
        ) : (
          <div className={modalIconCls("sm")} aria-hidden>
            {icon}
          </div>
        )
      ) : null}
      <div className="min-w-0 flex-1 pr-8">
        <DialogTitle
          className={cn(
            "m-0 truncate text-base font-semibold leading-none tracking-tight text-foreground",
            titleClassName,
          )}
        >
          {title}
        </DialogTitle>
        {description != null && description !== false ? (
          <DialogDescription
            className={cn(
              "m-0 mt-1 text-xs text-muted-foreground",
              descriptionClassName,
            )}
          >
            {description}
          </DialogDescription>
        ) : null}
      </div>
    </div>
  );
}
