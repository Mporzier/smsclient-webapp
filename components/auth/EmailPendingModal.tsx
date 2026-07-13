"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  email?: string | null;
  /** Renvoi de l’e-mail de confirmation (optionnel) */
  onResend?: () => void;
  resendPending?: boolean;
  resendMessage?: string | null;
  resendIsError?: boolean;
  /** "dialog" = cliquer le fond ferme (login). "blocking" = compte connecté non confirmé. */
  variant?: "dialog" | "blocking";
  extraActions?: ReactNode;
};

const defaultTitle = "Confirmation d’e-mail requise";

const defaultBody = (
  <>
    Vous devez valider votre adresse e-mail avant d’accéder au tableau de bord. Ouvrez
    le message que nous vous avons envoyé (pensez à vérifier les indésirables) et
    cliquez sur le lien de confirmation.
  </>
);

export function EmailPendingModal({
  open,
  onClose,
  title = defaultTitle,
  email,
  onResend,
  resendPending = false,
  resendMessage,
  resendIsError = false,
  variant = "dialog",
  extraActions,
}: Props) {
  const isBlocking = variant === "blocking";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isBlocking) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        data-cy="emailPendingModal"
        overlayClassName="z-[200] bg-foreground/55 backdrop-blur-sm"
        className={cn(
          "z-[200] w-full max-w-md gap-0 rounded-2xl border border-border bg-card p-6 text-left shadow-2xl ring-0"
        )}
        onPointerDownOutside={(e) => {
          if (isBlocking) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isBlocking) e.preventDefault();
        }}
      >
        <DialogTitle
          id="email-pending-title"
          className="text-lg font-black text-foreground"
        >
          {title}
        </DialogTitle>
        <DialogDescription className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {defaultBody}
        </DialogDescription>
        {email && (
          <p className="mt-2 rounded-lg bg-muted/50 px-2 py-1.5 text-center text-xs font-semibold text-foreground">
            {email}
          </p>
        )}

        {onResend && (
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={resendPending}
              onClick={onResend}
              className="h-auto w-full rounded-xl py-2.5 text-sm font-bold"
              data-cy="emailPendingModal-resend"
            >
              {resendPending ? "Envoi…" : "Renvoyer l’e-mail de confirmation"}
            </Button>
            {resendMessage && (
              <p
                className={cn(
                  "mt-2 text-center text-xs",
                  resendIsError ? "text-destructive" : "text-emerald-700"
                )}
              >
                {resendMessage}
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {extraActions}
          <Button
            type="button"
            variant="default"
            onClick={onClose}
            className="h-auto w-full rounded-xl py-2.5 text-sm font-bold"
            data-cy="emailPendingModal-dismiss"
          >
            {isBlocking ? "Se déconnecter" : "Compris"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
