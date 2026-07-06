"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { ProtoBtn } from "@/components/smsclient/ui";
import { defaultProfileForm, profileToForm } from "@/lib/supabase/profile";
import type { UserProfileForm } from "@/lib/types/profile";
import { UserRound, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { modalCloseBtnCompact, overlayCls } from "./modalChrome";
import { handleModalBackdropClick } from "./modalFormGuard";

const shellCls =
  "flex max-h-[min(86dvh,640px)] w-full max-w-[560px] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.20)]";

const inp =
  "h-11 w-full rounded-[14px] border border-slate-300/50 bg-white px-3.5 text-[15px] font-bold text-slate-900 outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]";
const lbl = "mb-1.5 block text-xs font-black text-slate-600";

type MonProfilModalProps = {
  open: boolean;
  onClose: () => void;
};

export function MonProfilModal({ open, onClose }: MonProfilModalProps) {
  const { user } = useAuth();
  const { profile, loading, saveProfile } = useUserProfile();
  const [saved, setSaved] = useState<Pick<
    UserProfileForm,
    "firstName" | "lastName" | "email" | "phone"
  >>({ firstName: "", lastName: "", email: "", phone: "" });
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const email = user?.email ?? "";
    const base = profile
      ? profileToForm(profile)
      : defaultProfileForm(email);
    const slice = {
      firstName: base.firstName,
      lastName: base.lastName,
      email: base.email,
      phone: base.phone,
    };
    setSaved(slice);
    setDraft(slice);
    setError(null);
    setFeedback(null);
  }, [open, profile, user?.email]);

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(null), 2200);
    return () => window.clearTimeout(t);
  }, [feedback]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const handleClose = useCallback(() => {
    if (saving) return;
    onClose();
  }, [onClose, saving]);

  const handleSave = useCallback(async () => {
    if (!draft.firstName.trim()) {
      setError("Le prénom est requis.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const email = user?.email ?? draft.email;
      const full = profile
        ? profileToForm(profile)
        : defaultProfileForm(email);
      await saveProfile({ ...full, ...draft, email });
      setSaved(draft);
      setFeedback("Profil mis à jour.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sauvegarde impossible.");
    } finally {
      setSaving(false);
    }
  }, [draft, profile, saveProfile, user?.email]);

  if (!open) return null;

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal
      aria-label="Mon profil"
      onClick={(e) =>
        handleModalBackdropClick(e, handleClose, false, !saving)
      }
    >
      <div className={shellCls}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#dfe6f2] bg-gradient-to-br from-blue-50 to-indigo-50 text-[#2f6fed]"
              aria-hidden
            >
              <UserRound className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <h2 className="m-0 truncate text-base font-black text-slate-900">
                Mon profil
              </h2>
              <p className="m-0 mt-0.5 text-xs font-semibold text-slate-500">
                Vos informations personnelles
              </p>
            </div>
          </div>
          <button
            type="button"
            className={modalCloseBtnCompact}
            aria-label="Fermer"
            onClick={handleClose}
            disabled={saving}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
          {loading && (
            <p className="m-0 text-sm font-semibold text-slate-500">
              Chargement…
            </p>
          )}
          {feedback && (
            <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">
              {feedback}
            </p>
          )}
          {error && (
            <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
            <div>
              <label className={lbl}>Prénom</label>
              <input
                className={inp}
                value={draft.firstName}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, firstName: e.target.value }))
                }
                placeholder="Ex : Patrick"
              />
            </div>
            <div>
              <label className={lbl}>Nom</label>
              <input
                className={inp}
                value={draft.lastName}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, lastName: e.target.value }))
                }
                placeholder="Ex : Azevedo"
              />
            </div>
            <div className="col-span-2 max-[480px]:col-span-1">
              <label className={lbl}>Email</label>
              <input
                className={inp}
                value={draft.email}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="email@domaine.fr"
              />
            </div>
            <div className="col-span-2 max-[480px]:col-span-1">
              <label className={lbl}>Téléphone</label>
              <input
                className={inp}
                value={draft.phone}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="06 00 00 00 00"
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3">
          <ProtoBtn onClick={handleClose} disabled={saving}>
            Fermer
          </ProtoBtn>
          <ProtoBtn
            primary
            onClick={() => void handleSave()}
            disabled={saving || !dirty}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </ProtoBtn>
        </div>
      </div>
    </div>
  );
}
