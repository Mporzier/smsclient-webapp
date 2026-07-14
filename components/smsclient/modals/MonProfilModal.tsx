"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultProfileForm, profileToForm } from "@/lib/supabase/profile";
import type { UserProfileForm } from "@/lib/types/profile";
import { cn } from "@/lib/utils";
import { UserRound, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  brandBtnCls,
  brandBtnPrimaryCls,
  brandInputCls,
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  modalCloseBtnCompact,
} from "./modalChrome";

const lbl = "mb-1.5 block text-xs font-black text-muted-foreground";

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

  const email = user?.email ?? "";
  const base = profile ? profileToForm(profile) : defaultProfileForm(email);
  const slice = {
    firstName: base.firstName,
    lastName: base.lastName,
    email: base.email,
    phone: base.phone,
  };
  const syncKey = `${open}:${profile?.userId ?? ""}:${email}`;
  const [prevSyncKey, setPrevSyncKey] = useState("");

  if (open && syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    setSaved(slice);
    setDraft(slice);
    setError(null);
    setFeedback(null);
  }
  if (!open && prevSyncKey !== "") {
    setPrevSyncKey("");
  }

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
      const nextEmail = user?.email ?? draft.email;
      const full = profile
        ? profileToForm(profile)
        : defaultProfileForm(nextEmail);
      await saveProfile({ ...full, ...draft, email: nextEmail });
      setSaved(draft);
      setFeedback("Profil mis à jour.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sauvegarde impossible.");
    } finally {
      setSaving(false);
    }
  }, [draft, profile, saveProfile, user]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "max-h-[min(86dvh,640px)] sm:max-w-[560px]",
          dialogContentZCls
        )}
        onPointerDownOutside={(e) => {
          if (saving || dirty) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (saving || dirty) e.preventDefault();
        }}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-gradient-to-br from-blue-50 to-indigo-50 text-ring"
              aria-hidden
            >
              <UserRound className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="m-0 truncate text-base font-black text-foreground">
                Mon profil
              </DialogTitle>
              <DialogDescription className="m-0 mt-0.5 text-xs font-semibold">
                Vos informations personnelles
              </DialogDescription>
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

        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/50 px-4 py-4">
          {loading && (
            <p className="m-0 text-sm font-semibold text-muted-foreground">
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
              <Label className={lbl} htmlFor="profil-first-name">
                Prénom
              </Label>
              <Input
                id="profil-first-name"
                className={brandInputCls}
                value={draft.firstName}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, firstName: e.target.value }))
                }
                placeholder="Ex : Patrick"
              />
            </div>
            <div>
              <Label className={lbl} htmlFor="profil-last-name">
                Nom
              </Label>
              <Input
                id="profil-last-name"
                className={brandInputCls}
                value={draft.lastName}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, lastName: e.target.value }))
                }
                placeholder="Ex : Azevedo"
              />
            </div>
            <div className="col-span-2 max-[480px]:col-span-1">
              <Label className={lbl} htmlFor="profil-email">
                Email
              </Label>
              <Input
                id="profil-email"
                className={brandInputCls}
                value={draft.email}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="email@domaine.fr"
              />
            </div>
            <div className="col-span-2 max-[480px]:col-span-1">
              <Label className={lbl} htmlFor="profil-phone">
                Téléphone
              </Label>
              <Input
                id="profil-phone"
                className={brandInputCls}
                value={draft.phone}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="06 00 00 00 00"
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-card px-4 py-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={brandBtnCls}
            onClick={handleClose}
            disabled={saving}
          >
            Fermer
          </Button>
          <Button
            type="button"
            variant="default"
            size="lg"
            className={brandBtnPrimaryCls}
            onClick={() => void handleSave()}
            disabled={saving || !dirty}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
