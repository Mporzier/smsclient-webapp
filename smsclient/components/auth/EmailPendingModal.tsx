"use client";

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
    Tu dois valider ton adresse e-mail avant d’accéder au tableau de bord. Ouvre le
    message que nous t’avons envoyé (pense à vérifier les indésirables) et clique
    sur le lien de confirmation.
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
  if (!open) {
    return null;
  }

  const backdrop = (
    <div
      className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
      onClick={variant === "dialog" ? onClose : undefined}
      onKeyDown={undefined}
      role="presentation"
    />
  );

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      data-cy="emailPendingModal"
    >
      {backdrop}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-pending-title"
      >
        <h2
          id="email-pending-title"
          className="text-lg font-black text-slate-900"
        >
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{defaultBody}</p>
        {email && (
          <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5 text-center text-xs font-semibold text-slate-800">
            {email}
          </p>
        )}

        {onResend && (
          <div className="mt-4">
            <button
              type="button"
              disabled={resendPending}
              onClick={onResend}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
              data-cy="emailPendingModal-resend"
            >
              {resendPending ? "Envoi…" : "Renvoyer l’e-mail de confirmation"}
            </button>
            {resendMessage && (
              <p
                className={`mt-2 text-center text-xs ${resendIsError ? "text-rose-700" : "text-emerald-700"}`}
              >
                {resendMessage}
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {extraActions}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(47,111,237,0.2)]"
            data-cy="emailPendingModal-dismiss"
          >
            {variant === "blocking" ? "Se déconnecter" : "Compris"}
          </button>
        </div>
      </div>
    </div>
  );
}
