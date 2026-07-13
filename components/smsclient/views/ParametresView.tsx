"use client";

import { BadgeSent, ProtoBtn } from "@/components/smsclient/ui";
import { ParametresSettingModal } from "@/components/smsclient/modals/ParametresSettingModal";
import { cn } from "@/lib/cn";
import { ParametresTrashSection } from "@/components/smsclient/views/ParametresTrashSection";
import { InvoicesTable } from "@/components/smsclient/views/parametres/InvoicesTable";
import {
  ModalPanel,
  SettingCard,
} from "@/components/smsclient/views/parametres/SettingCard";
import {
  allSettingCards,
  emptyProfileForm,
  parametresFieldInp,
  parametresFieldLbl,
  type SettingId,
} from "@/components/smsclient/views/parametres/parametresSettings";
import { BusinessActivityPicker } from "@/components/onboarding/BusinessActivityPicker";
import type { CreditPurchaseRowData } from "@/lib/types/credits";
import type { UserProfileForm } from "@/lib/types/profile";
import type { DeletedContactRow, DeletedGroupRow } from "@/lib/types/trash";
import { useEffect, useMemo, useState } from "react";

export type ParametresViewProps = {
  profileForm: UserProfileForm | null;
  profileLoading?: boolean;
  onSaveProfile: (form: UserProfileForm) => Promise<void>;
  purchases?: CreditPurchaseRowData[];
  purchasesLoading?: boolean;
  onInvoiceClick?: (id: string) => void;
  trashContacts?: DeletedContactRow[];
  trashGroups?: DeletedGroupRow[];
  trashLoading?: boolean;
  trashError?: string | null;
  onRestoreTrashContacts?: (ids: string[]) => Promise<void>;
  onRestoreTrashGroups?: (ids: string[]) => Promise<void>;
  onRefreshTrash?: () => Promise<void>;
};

export function ParametresView({
  profileForm,
  profileLoading = false,
  onSaveProfile,
  purchases = [],
  purchasesLoading = false,
  onInvoiceClick,
  trashContacts = [],
  trashGroups = [],
  trashLoading = false,
  trashError = null,
  onRestoreTrashContacts,
  onRestoreTrashGroups,
  onRefreshTrash,
}: ParametresViewProps) {
  const [savedForm, setSavedForm] = useState<UserProfileForm>(emptyProfileForm);
  const [draftForm, setDraftForm] = useState<UserProfileForm>(emptyProfileForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [openSetting, setOpenSetting] = useState<SettingId | null>(null);

  const dirty = JSON.stringify(draftForm) !== JSON.stringify(savedForm);
  const changed = <K extends keyof UserProfileForm>(key: K) =>
    draftForm[key] !== savedForm[key];

  const openCard = allSettingCards.find((c) => c.id === openSetting);

  useEffect(() => {
    if (!profileForm || dirty) return;
    setSavedForm(profileForm);
    setDraftForm(profileForm);
  }, [profileForm, dirty]);

  const setField = <K extends keyof UserProfileForm>(
    key: K,
    value: UserProfileForm[K]
  ) => {
    setDraftForm((prev) => ({ ...prev, [key]: value }));
  };

  const closeModal = () => {
    setOpenSetting(null);
    setSaveError(null);
  };

  const handleCloseModal = () => {
    if (dirty) setDraftForm(savedForm);
    closeModal();
  };

  const validateBeforeSave = (): string | null => {
    switch (openSetting) {
      case "entreprise":
        if (!draftForm.companyName.trim()) {
          return "Le nom de l'entreprise est requis.";
        }
        if (!draftForm.businessActivity) {
          return "L'activité de l'entreprise est requise.";
        }
        return null;
      case "expediteur-sms":
        if (!draftForm.sender.trim()) {
          return "Le nom d'expéditeur SMS est requis.";
        }
        return null;
      default:
        return null;
    }
  };

  const onSaveChanges = async () => {
    if (!dirty) return;
    const validationError = validateBeforeSave();
    if (validationError) {
      setSaveError(validationError);
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      await onSaveProfile(draftForm);
      setSavedForm(draftForm);
      closeModal();
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Sauvegarde impossible."
      );
    } finally {
      setSaving(false);
    }
  };

  const trashAvailable =
    Boolean(onRestoreTrashContacts) &&
    Boolean(onRestoreTrashGroups) &&
    Boolean(onRefreshTrash);

  const visibleCards = trashAvailable
    ? allSettingCards
    : allSettingCards.filter((c) => c.id !== "corbeille");

  const modalIcon = openCard ? (
    <openCard.icon className="h-5 w-5" strokeWidth={2.25} />
  ) : null;

  return (
    <>
      <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
        {visibleCards.map((card) => (
          <SettingCard
            key={card.id}
            title={card.title}
            description={card.description}
            icon={card.icon}
            onClick={() => setOpenSetting(card.id)}
          />
        ))}
      </div>

      {openCard && (
        <ParametresSettingModal
          open={openSetting !== null}
          title={openCard.title}
          description={openCard.description}
          icon={modalIcon}
          onClose={handleCloseModal}
          onSave={openCard.savable ? onSaveChanges : undefined}
          saving={saving}
          dirty={dirty}
          wide={
            openSetting === "factures" ||
            openSetting === "corbeille" ||
            openSetting === "adresse-facturation"
          }
        >
          {profileLoading && openCard.savable && (
            <p className="m-0 mb-3 text-sm font-semibold text-slate-500">
              Chargement…
            </p>
          )}
          {saveError && (
            <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
              {saveError}
            </p>
          )}

          {openSetting === "entreprise" && (
            <ModalPanel>
              <div className="grid gap-3">
                <div>
                  <label className={parametresFieldLbl}>Nom de l&apos;entreprise</label>
                  <input
                    className={cn(
                      parametresFieldInp,
                      changed("companyName") &&
                        "border-blue-400 ring-2 ring-blue-100"
                    )}
                    value={draftForm.companyName}
                    onChange={(e) => setField("companyName", e.target.value)}
                  />
                </div>
                <div>
                  <label className={parametresFieldLbl}>Secteur d&apos;activité</label>
                  <div
                    className={cn(
                      "rounded-xl p-1",
                      changed("businessActivity") && "ring-2 ring-blue-100"
                    )}
                  >
                    <BusinessActivityPicker
                      value={draftForm.businessActivity}
                      onChange={(id) => setField("businessActivity", id)}
                    />
                  </div>
                </div>
              </div>
            </ModalPanel>
          )}

          {openSetting === "identifiants-legaux" && (
            <ModalPanel>
              <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                <div>
                  <label className={parametresFieldLbl}>SIRET</label>
                  <input
                    className={cn(
                      parametresFieldInp,
                      changed("siret") && "border-blue-400 ring-2 ring-blue-100"
                    )}
                    value={draftForm.siret}
                    onChange={(e) => setField("siret", e.target.value)}
                  />
                </div>
                <div>
                  <label className={parametresFieldLbl}>TVA</label>
                  <input
                    className={cn(
                      parametresFieldInp,
                      changed("tva") && "border-blue-400 ring-2 ring-blue-100"
                    )}
                    value={draftForm.tva}
                    onChange={(e) => setField("tva", e.target.value)}
                  />
                </div>
              </div>
            </ModalPanel>
          )}

          {openSetting === "adresse-facturation" && (
            <ModalPanel>
              <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                <div className="col-span-2">
                  <label className={parametresFieldLbl}>Adresse</label>
                  <input
                    className={cn(
                      parametresFieldInp,
                      changed("address") && "border-blue-400 ring-2 ring-blue-100"
                    )}
                    value={draftForm.address}
                    onChange={(e) => setField("address", e.target.value)}
                  />
                </div>
                <div>
                  <label className={parametresFieldLbl}>Code postal</label>
                  <input
                    className={cn(
                      parametresFieldInp,
                      changed("zip") && "border-blue-400 ring-2 ring-blue-100"
                    )}
                    value={draftForm.zip}
                    onChange={(e) => setField("zip", e.target.value)}
                  />
                </div>
                <div>
                  <label className={parametresFieldLbl}>Ville</label>
                  <input
                    className={cn(
                      parametresFieldInp,
                      changed("city") && "border-blue-400 ring-2 ring-blue-100"
                    )}
                    value={draftForm.city}
                    onChange={(e) => setField("city", e.target.value)}
                  />
                </div>
                <div className="col-span-2 max-[480px]:col-span-1">
                  <label className={parametresFieldLbl}>Pays</label>
                  <input
                    className={cn(
                      parametresFieldInp,
                      changed("country") && "border-blue-400 ring-2 ring-blue-100"
                    )}
                    value={draftForm.country}
                    onChange={(e) => setField("country", e.target.value)}
                  />
                </div>
              </div>
            </ModalPanel>
          )}

          {openSetting === "contact-facturation" && (
            <ModalPanel>
              <div>
                <label className={parametresFieldLbl}>Contact facturation</label>
                <input
                  className={cn(
                    parametresFieldInp,
                    changed("billingContact") &&
                      "border-blue-400 ring-2 ring-blue-100"
                  )}
                  value={draftForm.billingContact}
                  onChange={(e) => setField("billingContact", e.target.value)}
                  placeholder="Nom ou email du contact"
                />
              </div>
            </ModalPanel>
          )}

          {openSetting === "abonnement" && (
            <ModalPanel>
              <div className="flex justify-between gap-3 text-sm font-extrabold">
                <span className="text-slate-600">Formule</span>
                <strong>Pay-as-you-go</strong>
              </div>
              <p className="m-0 mt-2 text-xs font-semibold text-slate-500">
                Vous payez uniquement les crédits SMS consommés.
              </p>
            </ModalPanel>
          )}

          {openSetting === "paiement" && (
            <ModalPanel>
              <div className="flex justify-between gap-3 text-sm font-extrabold">
                <span className="text-slate-600">Carte enregistrée</span>
                <strong>VISA •••• 8003</strong>
              </div>
              <div className="mt-3">
                <ProtoBtn>Modifier la carte</ProtoBtn>
              </div>
            </ModalPanel>
          )}

          {openSetting === "securite" && (
            <ModalPanel>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-extrabold text-slate-600">
                  Authentification 2FA
                </span>
                <BadgeSent>Activé</BadgeSent>
              </div>
              <div className="mt-3">
                <ProtoBtn>Gérer la sécurité</ProtoBtn>
              </div>
            </ModalPanel>
          )}

          {openSetting === "factures" && (
            <InvoicesTable
              purchases={purchases}
              loading={purchasesLoading}
              onInvoiceClick={onInvoiceClick}
            />
          )}

          {openSetting === "expediteur-sms" && (
            <ModalPanel>
              <div>
                <label className={parametresFieldLbl}>
                  Nom d&apos;expéditeur SMS (11 car. max)
                </label>
                <input
                  className={cn(
                    parametresFieldInp,
                    changed("sender") && "border-blue-400 ring-2 ring-blue-100"
                  )}
                  maxLength={11}
                  value={draftForm.sender}
                  onChange={(e) => setField("sender", e.target.value)}
                  placeholder="BOULANGERIE"
                  autoComplete="off"
                />
                <p className="mt-1.5 text-xs font-bold text-slate-500">
                  Affiché comme expéditeur de vos campagnes SMS.
                </p>
              </div>
            </ModalPanel>
          )}

          {openSetting === "notifications-email" && (
            <ModalPanel>
              <label className="flex items-start gap-2.5 text-sm font-extrabold text-slate-600">
                <input
                  type="checkbox"
                  className="mt-0.5 h-[18px] w-[18px]"
                  checked={draftForm.notifyInvoices}
                  onChange={(e) => setField("notifyInvoices", e.target.checked)}
                />
                Recevoir les notifications email (factures, alertes)
              </label>
            </ModalPanel>
          )}

          {openSetting === "resume-mensuel" && (
            <ModalPanel>
              <label className="flex items-start gap-2.5 text-sm font-extrabold text-slate-600">
                <input
                  type="checkbox"
                  className="mt-0.5 h-[18px] w-[18px]"
                  checked={draftForm.notifySummary}
                  onChange={(e) => setField("notifySummary", e.target.checked)}
                />
                Recevoir un résumé mensuel de vos campagnes par email
              </label>
            </ModalPanel>
          )}

          {openSetting === "corbeille" && trashAvailable && (
            <ParametresTrashSection
              contacts={trashContacts}
              groups={trashGroups}
              loading={trashLoading}
              error={trashError}
              onRestoreContacts={onRestoreTrashContacts!}
              onRestoreGroups={onRestoreTrashGroups!}
              onRefresh={onRefreshTrash!}
            />
          )}
        </ParametresSettingModal>
      )}
    </>
  );
}
