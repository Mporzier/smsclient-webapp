"use client";

import { ProtoBtn } from "@/components/smsclient/ui";

type DecoProps = { onBackContacts: () => void };

export function DeconnexionView({ onBackContacts }: DecoProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
      <h2 className="m-0 text-base font-black text-slate-900">Déconnexion</h2>
      <p className="m-0 mt-2 font-semibold leading-relaxed text-slate-600">
        Ceci est un prototype. Clique sur <strong>Contacts</strong> pour revenir.
      </p>
      <div className="mt-3">
        <ProtoBtn primary onClick={onBackContacts}>
          Retour
        </ProtoBtn>
      </div>
    </div>
  );
}
