"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ParametresSettingModal } from "@/components/smsclient/modals/ParametresSettingModal";
import { cn } from "@/lib/cn";
import { ParametresTrashSection } from "@/components/smsclient/views/ParametresTrashSection";
import { ApparenceSettingsPanel } from "@/components/smsclient/views/parametres/ApparenceSettingsPanel";
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
import { useI18n, type MessageKey } from "@/lib/i18n";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import { useEffect, useState } from "react";

function sectionTitleKey(id: SettingSectionId): MessageKey {
  return `parametres.section.${id}` as MessageKey;
}

function cardTitleKey(id: SettingId): MessageKey {
  return `parametres.card.${id}.title` as MessageKey;
}

function cardDescKey(id: SettingId): MessageKey {
  return `parametres.card.${id}.description` as MessageKey;
}

export type ParametresViewProps = {
  profileForm: UserProfileForm | null;
  profileLoading?: boolean;
  onSaveProfile: (form: UserProfileForm) => Promise<void>;
  purchases?: CreditPurchaseRowData[];
  purchasesLoading?: boolean;
  purchasesLoadingMore?: boolean;
  purchasesHasMore?: boolean;
  onLoadMorePurchases?: () => void;
  purchasesSorting?: SortingState;
  onPurchasesSortingChange?: OnChangeFn<SortingState>;
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
  purchasesLoadingMore = false,
  purchasesHasMore = false,
  onLoadMorePurchases,
  purchasesSorting = [],
  onPurchasesSortingChange,
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
  const { t } = useI18n();
  const [savedForm, setSavedForm] = useState<UserProfileForm>(emptyProfileForm);
  const [draftForm, setDraftForm] = useState<UserProfileForm>(emptyProfileForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [openSetting, setOpenSetting] = useState<SettingId | null>(null);
  const [activeSection, setActiveSection] = useState<SettingSectionId>(
    () => consumeRequestedParametresSection() ?? "compte",
  );
  const [compteSaveError, setCompteSaveError] = useState<string | null>(null);

  useEffect(() => {
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
          return t("parametres.companyNameRequired");
        }
        if (!draftForm.businessActivity) {
          return t("parametres.activityRequired");
        }
        return null;
      case "expediteur-sms":
        if (!draftForm.sender.trim()) {
          return t("parametres.senderRequired");
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
        e instanceof Error ? e.message : t("parametres.saveFailed")
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
      const msg = t("parametres.firstNameRequired");
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
        e instanceof Error ? e.message : t("parametres.saveFailed");
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
    if (section.id === "compte" || section.id === "apparence") return true;
    return visibleCards.some((c) => c.section === section.id);
  });

  const sectionId =
    availableSections.find((s) => s.id === activeSection)?.id ??
    availableSections[0]?.id ??
    "compte";

  const sectionCards = visibleCards.filter((c) => c.section === sectionId);

  const modalIcon = openCard ? (
    <openCard.icon className="h-5 w-5" strokeWidth={2.25} />
  ) : null;

  return (
    <>
      <div className="flex flex-col gap-4">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label={t("parametres.sectionsAria")}
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
              {t(sectionTitleKey(section.id))}
            </Button>
          ))}
        </div>

        <div
          role="tabpanel"
          aria-label={
            availableSections.find((s) => s.id === sectionId)
              ? t(sectionTitleKey(sectionId))
              : t("shell.settings")
          }
        >
          {sectionId === "compte" ? (
            <CompteSettingsPanel
              form={draftForm}
              loading={profileLoading}
              saving={saving}
              saveError={compteSaveError}
              onSaveField={onSaveCompteField}
            />
          ) : sectionId === "apparence" ? (
            <ApparenceSettingsPanel />
          ) : (
            <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
              {sectionCards.map((card) => (
                <SettingCard
                  key={card.id}
                  title={t(cardTitleKey(card.id))}
                  description={t(cardDescKey(card.id))}
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
          title={t(cardTitleKey(openCard.id))}
          description={t(cardDescKey(openCard.id))}
          icon={modalIcon}
          onClose={handleCloseModal}
          onSave={openCard.savable ? onSaveChanges : undefined}
          saving={saving}
          wide={
            openSetting === "factures" ||
            openSetting === "corbeille" ||
            openSetting === "champs-perso" ||
            openSetting === "adresse-facturation"
          }
        >
          {profileLoading && openCard.savable && (
            <p className="m-0 mb-3 text-sm font-semibold text-slate-500">
              {t("parametres.loading")}
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
                  <label className={parametresFieldLbl}>
                    {t("parametres.field.companyName")}
                  </label>
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
                    {t("parametres.field.businessActivity")}
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
                  <label className={parametresFieldLbl}>
                    {t("parametres.field.siret")}
                  </label>
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
                  <label className={parametresFieldLbl}>
                    {t("parametres.field.tva")}
                  </label>
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
                  <label className={parametresFieldLbl}>
                    {t("parametres.field.address")}
                  </label>
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
                  <label className={parametresFieldLbl}>
                    {t("parametres.field.zip")}
                  </label>
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
                  <label className={parametresFieldLbl}>
                    {t("parametres.field.city")}
                  </label>
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
                  <label className={parametresFieldLbl}>
                    {t("parametres.field.country")}
                  </label>
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
                <label className={parametresFieldLbl}>
                  {t("parametres.field.billingContact")}
                </label>
                <input
                  className={cn(
                    parametresFieldInp,
                    changed("billingContact") &&
                      "border-blue-400 ring-2 ring-blue-100"
                  )}
                  value={draftForm.billingContact}
                  onChange={(e) => setField("billingContact", e.target.value)}
                  placeholder={t("parametres.field.billingContactPlaceholder")}
                />
              </div>
            </ModalPanel>
          )}

          {openSetting === "abonnement" && (
            <ModalPanel>
              <p className="m-0 text-sm font-extrabold text-foreground">
                {t("parametres.upcomingTitle")}
              </p>
              <p className="m-0 mt-2 text-xs font-semibold text-muted-foreground">
                {t("parametres.abonnementBody")}
              </p>
            </ModalPanel>
          )}

          {openSetting === "paiement" && (
            <ModalPanel>
              <p className="m-0 text-sm font-extrabold text-foreground">
                {t("parametres.upcomingTitle")}
              </p>
              <p className="m-0 mt-2 text-xs font-semibold text-muted-foreground">
                {t("parametres.paiementBody")}
              </p>
            </ModalPanel>
          )}

          {openSetting === "factures" && (
            <InvoicesTable
              purchases={purchases}
              loading={purchasesLoading}
              loadingMore={purchasesLoadingMore}
              hasMore={purchasesHasMore}
              onLoadMore={onLoadMorePurchases}
              onInvoiceClick={onInvoiceClick}
              sorting={purchasesSorting}
              onSortingChange={onPurchasesSortingChange ?? (() => {})}
            />
          )}

          {openSetting === "expediteur-sms" && (
            <ModalPanel>
              <div>
                <label className={parametresFieldLbl}>
                  {t("parametres.field.sender")}
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
                  {t("parametres.field.senderHint")}
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
                {t("parametres.field.notifyInvoices")}
              </label>
              <p className="m-0 mt-2 text-xs font-semibold text-muted-foreground">
                {t("parametres.field.notifyInvoicesHint")}
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
                {t("parametres.field.notifySummary")}
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
