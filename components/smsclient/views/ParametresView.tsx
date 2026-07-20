"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ParametresSettingModal } from "@/components/smsclient/modals/ParametresSettingModal";
import { cn } from "@/lib/cn";
import { ParametresTrashSection } from "@/components/smsclient/views/ParametresTrashSection";
import { CompteSettingsPanel } from "@/components/smsclient/views/parametres/CompteSettingsPanel";
import { CustomFieldsSettingsPanel } from "@/components/smsclient/views/parametres/CustomFieldsSettingsPanel";
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
  settingSections,
  type SettingId,
  type SettingSectionId,
} from "@/components/smsclient/views/parametres/parametresSettings";
import {
  consumeRequestedParametresSection,
  isSettingSectionId,
  PARAMETRES_SECTION_EVENT,
} from "@/components/smsclient/views/parametres/parametresNav";
import { BusinessActivitySelect } from "@/components/smsclient/views/parametres/BusinessActivitySelect";
import type { CreditPurchaseRowData } from "@/lib/types/credits";
import type { CustomFieldDef, CustomFieldType } from "@/lib/types/customFields";
import type { UserProfileForm } from "@/lib/types/profile";
import type { DeletedContactRow, DeletedGroupRow } from "@/lib/types/trash";
import { useEffect, useState } from "react";

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
  customFieldDefs?: CustomFieldDef[];
  customFieldsLoading?: boolean;
  customFieldsError?: string | null;
  onCreateCustomField?: (input: {
    label: string;
    fieldType: CustomFieldType;
  }) => Promise<{ error: Error | null }>;
  onRenameCustomField?: (
    fieldId: string,
    label: string,
  ) => Promise<{ error: Error | null }>;
  onRemoveCustomField?: (fieldId: string) => Promise<{ error: Error | null }>;
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
  customFieldDefs = [],
  customFieldsLoading = false,
  customFieldsError = null,
  onCreateCustomField,
  onRenameCustomField,
  onRemoveCustomField,
}: ParametresViewProps) {
  const [savedForm, setSavedForm] = useState<UserProfileForm>(emptyProfileForm);
  const [draftForm, setDraftForm] = useState<UserProfileForm>(emptyProfileForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [openSetting, setOpenSetting] = useState<SettingId | null>(null);
  const [activeSection, setActiveSection] =
    useState<SettingSectionId>("compte");
  const [compteSaveError, setCompteSaveError] = useState<string | null>(null);

  useEffect(() => {
    const pending = consumeRequestedParametresSection();
    if (pending) setActiveSection(pending);
    const onSection = (e: Event) => {
      const detail = (e as CustomEvent<unknown>).detail;
      if (typeof detail === "string" && isSettingSectionId(detail)) {
        setActiveSection(detail);
      }
    };
    window.addEventListener(PARAMETRES_SECTION_EVENT, onSection);
    return () =>
      window.removeEventListener(PARAMETRES_SECTION_EVENT, onSection);
  }, []);

  const dirty = JSON.stringify(draftForm) !== JSON.stringify(savedForm);
  const changed = <K extends keyof UserProfileForm>(key: K) =>
    draftForm[key] !== savedForm[key];

  const openCard = allSettingCards.find((c) => c.id === openSetting);

  const profileSyncKey = profileForm ? JSON.stringify(profileForm) : null;
  const [syncedProfileKey, setSyncedProfileKey] = useState<string | null>(null);
  if (profileForm && !dirty && profileSyncKey !== syncedProfileKey) {
    setSyncedProfileKey(profileSyncKey);
    setSavedForm(profileForm);
    setDraftForm(profileForm);
  }

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

  const onSaveCompteField = async <K extends keyof UserProfileForm>(
    key: K,
    value: UserProfileForm[K],
  ) => {
    const next = { ...draftForm, [key]: value };
    if (!next.firstName.trim()) {
      const msg = "Le prénom est requis.";
      setCompteSaveError(msg);
      throw new Error(msg);
    }
    setCompteSaveError(null);
    setDraftForm(next);
    setSaving(true);
    try {
      await onSaveProfile(next);
      setSavedForm(next);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Sauvegarde impossible.";
      setCompteSaveError(msg);
      throw e instanceof Error ? e : new Error(msg);
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

  const availableSections = settingSections.filter((section) => {
    if (section.id === "compte") return true;
    return visibleCards.some((c) => c.section === section.id);
  });

  const sectionId =
    availableSections.find((s) => s.id === activeSection)?.id ??
    availableSections[0]?.id ??
    "compte";

  const sectionCards = visibleCards.filter((c) => c.section === sectionId);
  const isCompteSection = sectionId === "compte";

  const modalIcon = openCard ? (
    <openCard.icon className="h-5 w-5" strokeWidth={2.25} />
  ) : null;

  return (
    <>
      <div className="flex flex-col gap-4">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Sections paramètres"
        >
          {availableSections.map((section) => (
            <Button
              key={section.id}
              type="button"
              size="sm"
              variant={sectionId === section.id ? "default" : "outline"}
              role="tab"
              aria-selected={sectionId === section.id}
              onClick={() => setActiveSection(section.id)}
            >
              {section.title}
            </Button>
          ))}
        </div>

        <div
          role="tabpanel"
          aria-label={
            availableSections.find((s) => s.id === sectionId)?.title ??
            "Paramètres"
          }
        >
          {isCompteSection ? (
            <CompteSettingsPanel
              form={draftForm}
              loading={profileLoading}
              saving={saving}
              saveError={compteSaveError}
              onSaveField={onSaveCompteField}
            />
          ) : (
            <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
              {sectionCards.map((card) => (
                <SettingCard
                  key={card.id}
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  upcoming={card.upcoming}
                  onClick={() => setOpenSetting(card.id)}
                />
              ))}
            </div>
          )}
        </div>
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
            openSetting === "champs-perso" ||
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
                  <label className={parametresFieldLbl}>
                    Secteur d&apos;activité
                  </label>
                  <BusinessActivitySelect
                    value={draftForm.businessActivity}
                    onChange={(id) => setField("businessActivity", id)}
                    highlighted={changed("businessActivity")}
                  />
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
              <p className="m-0 text-sm font-extrabold text-foreground">
                Bientôt disponible
              </p>
              <p className="m-0 mt-2 text-xs font-semibold text-muted-foreground">
                Formule pay-as-you-go : vous payez uniquement les crédits SMS
                consommés. La gestion d&apos;abonnement sera branchée plus
                tard.
              </p>
            </ModalPanel>
          )}

          {openSetting === "paiement" && (
            <ModalPanel>
              <p className="m-0 text-sm font-extrabold text-foreground">
                Bientôt disponible
              </p>
              <p className="m-0 mt-2 text-xs font-semibold text-muted-foreground">
                Enregistrement et modification de carte bancaire pas encore
                branchés.
              </p>
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
                <Checkbox
                  checked={draftForm.notifyInvoices}
                  onCheckedChange={(checked) =>
                    setField("notifyInvoices", checked === true)
                  }
                  className="mt-0.5"
                />
                Recevoir des alertes et conseils par email
              </label>
              <p className="m-0 mt-2 text-xs font-semibold text-muted-foreground">
                Les factures sont toujours envoyées par email.
              </p>
            </ModalPanel>
          )}

          {openSetting === "resume-mensuel" && (
            <ModalPanel>
              <label className="flex items-start gap-2.5 text-sm font-extrabold text-slate-600">
                <Checkbox
                  checked={draftForm.notifySummary}
                  onCheckedChange={(checked) =>
                    setField("notifySummary", checked === true)
                  }
                  className="mt-0.5"
                />
                Recevoir un résumé mensuel de vos campagnes par email
              </label>
            </ModalPanel>
          )}

          {openSetting === "champs-perso" &&
            onCreateCustomField &&
            onRenameCustomField &&
            onRemoveCustomField && (
              <CustomFieldsSettingsPanel
                defs={customFieldDefs}
                loading={customFieldsLoading}
                error={customFieldsError}
                onCreate={onCreateCustomField}
                onRename={onRenameCustomField}
                onRemove={onRemoveCustomField}
              />
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
