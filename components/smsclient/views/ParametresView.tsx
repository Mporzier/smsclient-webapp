"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LoadingLabel } from "@/components/ui/loading-label";
import { toast } from "@/components/ui/sonner";
import { ParametresSettingModal } from "@/components/smsclient/modals/ParametresSettingModal";
import { ParametresTrashSection } from "@/components/smsclient/views/ParametresTrashSection";
import { TRASH_RETENTION_DAYS } from "@/lib/proto/trashRetention";
import { ApparenceSettingsPanel } from "@/components/smsclient/views/parametres/ApparenceSettingsPanel";
import { CompteSettingsPanel } from "@/components/smsclient/views/parametres/CompteSettingsPanel";
import { CustomFieldsSettingsPanel } from "@/components/smsclient/views/parametres/CustomFieldsSettingsPanel";
import {
  ENTREPRISE_SUBSECTION_FIELDS,
  EntrepriseSettingsPanel,
  type EntrepriseSectionId,
} from "@/components/smsclient/views/parametres/EntrepriseSettingsPanel";
import {
  CAMPAGNES_SUBSECTION_FIELDS,
  CampagnesSettingsPanel,
  type CampagnesSectionId,
} from "@/components/smsclient/views/parametres/CampagnesSettingsPanel";
import {
  FACTURATION_SUBSECTION_FIELDS,
  FacturationSettingsPanel,
  type FacturationSectionId,
} from "@/components/smsclient/views/parametres/FacturationSettingsPanel";
import { firstEntrepriseSubsectionErrorKey } from "@/lib/forms/entrepriseValidation";
import { InvoicesTable } from "@/components/smsclient/views/parametres/InvoicesTable";
import {
  allSettingCards,
  emptyProfileForm,
  isSectionDirty,
  sectionDirtyFieldCount,
  sectionProfileFields,
  settingSections,
  type SettingId,
  type SettingSectionId,
} from "@/components/smsclient/views/parametres/parametresSettings";
import {
  consumeRequestedParametresSection,
  isSettingSectionId,
  PARAMETRES_SECTION_EVENT,
} from "@/components/smsclient/views/parametres/parametresNav";
import type { CreditPurchaseRowData } from "@/lib/types/credits";
import {
  CUSTOM_FIELD_MAX_PER_ACCOUNT,
  type CustomFieldDef,
  type CustomFieldType,
} from "@/lib/types/customFields";
import type { UserProfileForm } from "@/lib/types/profile";
import type {
  DeletedContactRow,
  DeletedGroupRow,
  TrashRestoreResult,
} from "@/lib/types/trash";
import { useI18n, type MessageKey } from "@/lib/i18n";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

function sectionTitleKey(id: SettingSectionId): MessageKey {
  return `parametres.section.${id}` as MessageKey;
}

function cardTitleKey(id: SettingId): MessageKey {
  return `parametres.card.${id}.title` as MessageKey;
}

function cardDescKey(id: SettingId): MessageKey {
  return `parametres.card.${id}.description` as MessageKey;
}

function cardDescVars(
  id: SettingId,
): Record<string, string | number> | undefined {
  if (id === "champs-perso") return { n: CUSTOM_FIELD_MAX_PER_ACCOUNT };
  return undefined;
}

/** Réglages assez riches pour rester en modale (tableaux, CRUD). */
const MODAL_SETTINGS = new Set<SettingId>([
  "factures",
  "champs-perso",
  "corbeille",
]);

function sectionSaveLabelKey(id: SettingSectionId): MessageKey | null {
  switch (id) {
    case "entreprise":
      return "parametres.saveSection.entreprise";
    case "sms-alertes":
      return "parametres.saveSection.smsAlertes";
    default:
      return null;
  }
}

function SettingsBlock({
  icon: Icon,
  title,
  description,
  upcoming,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  upcoming?: string | null;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 border-b border-border pb-6 last:border-b-0 last:pb-0 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <div className="flex items-start gap-2.5">
        <Icon
          className="mt-0.5 size-4 shrink-0 text-ring"
          strokeWidth={2.25}
          aria-hidden
        />
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            {title}
            {upcoming ? (
              <Badge variant="outline" className="uppercase">
                {upcoming}
              </Badge>
            ) : null}
          </h3>
          <p className="mt-1 text-xs font-medium leading-snug text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function SettingsModalRow({
  icon: Icon,
  title,
  description,
  openLabel,
  onOpen,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  openLabel: string;
  onOpen: () => void;
}) {
  return (
    <section className="grid gap-3 border-b border-border pb-6 last:border-b-0 last:pb-0 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <div className="flex items-start gap-2.5">
        <Icon
          className="mt-0.5 size-4 shrink-0 text-ring"
          strokeWidth={2.25}
          aria-hidden
        />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-xs font-medium leading-snug text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div>
        <Button type="button" variant="outline" size="sm" onClick={onOpen}>
          {openLabel}
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </section>
  );
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
  onRestoreTrashContacts?: (ids: string[]) => Promise<TrashRestoreResult>;
  onRestoreTrashGroups?: (ids: string[]) => Promise<TrashRestoreResult>;
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
  onRemoveCustomField?: (fieldIds: string[]) => Promise<{ error: Error | null }>;
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

  const validateSectionBeforeSave = (
    activeSectionId: SettingSectionId,
  ): string | null => {
    if (
      activeSectionId === "entreprise" &&
      changed("companyName") &&
      !draftForm.companyName.trim()
    ) {
      return t("parametres.companyNameRequired");
    }
    if (
      activeSectionId === "entreprise" &&
      changed("businessActivity") &&
      !draftForm.businessActivity
    ) {
      return t("parametres.activityRequired");
    }
    if (
      activeSectionId === "campagnes" &&
      changed("sender") &&
      !draftForm.sender.trim()
    ) {
      return t("parametres.senderRequired");
    }
    return null;
  };

  const revertSectionDraft = (activeSectionId: SettingSectionId) => {
    const fields = sectionProfileFields(activeSectionId);
    if (!fields.length) return;
    setDraftForm((prev) => ({
      ...prev,
      ...(Object.fromEntries(
        fields.map((key) => [key, savedForm[key]]),
      ) as Partial<UserProfileForm>),
    }));
    setSaveError(null);
  };

  const onSaveChanges = async (activeSectionId: SettingSectionId) => {
    if (!isSectionDirty(activeSectionId, draftForm, savedForm)) return;
    const validationError = validateSectionBeforeSave(activeSectionId);
    if (validationError) {
      setSaveError(validationError);
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      await onSaveProfile(draftForm);
      setSavedForm(draftForm);
      setOpenSetting(null);
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : t("parametres.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  };

  const onSaveEntrepriseSubsection = async (
    subsectionId: EntrepriseSectionId,
  ) => {
    const subsectionDirty = ENTREPRISE_SUBSECTION_FIELDS[subsectionId].some(
      (key) => changed(key),
    );
    if (!subsectionDirty) return;

    if (subsectionId === "entreprise") {
      if (changed("companyName") && !draftForm.companyName.trim()) {
        setSaveError(t("parametres.companyNameRequired"));
        return;
      }
      if (changed("businessActivity") && !draftForm.businessActivity) {
        setSaveError(t("parametres.activityRequired"));
        return;
      }
    }

    const formatErrorKey = firstEntrepriseSubsectionErrorKey(
      ENTREPRISE_SUBSECTION_FIELDS[subsectionId],
      draftForm,
    );
    if (formatErrorKey) {
      setSaveError(t(formatErrorKey));
      return;
    }

    setSaveError(null);
    setSaving(true);
    try {
      await onSaveProfile(draftForm);
      setSavedForm(draftForm);
      toast(t("parametres.savedToast"));
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : t("parametres.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  };

  const onSaveFacturationSubsection = async (
    subsectionId: FacturationSectionId,
  ) => {
    const fields = FACTURATION_SUBSECTION_FIELDS[subsectionId];
    const trimmedContact = draftForm.billingContact.trim();
    const nextForm =
      trimmedContact === draftForm.billingContact
        ? draftForm
        : { ...draftForm, billingContact: trimmedContact };
    if (nextForm !== draftForm) {
      setDraftForm(nextForm);
    }

    const subsectionDirty = fields.some(
      (key) => nextForm[key] !== savedForm[key],
    );
    if (!subsectionDirty) return;

    const formatErrorKey = firstEntrepriseSubsectionErrorKey(fields, nextForm);
    if (formatErrorKey) {
      setSaveError(t(formatErrorKey));
      return;
    }

    setSaveError(null);
    setSaving(true);
    try {
      await onSaveProfile(nextForm);
      setSavedForm(nextForm);
      toast(t("parametres.savedToast"));
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : t("parametres.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  };

  const onSaveCampagnesSubsection = async (
    subsectionId: CampagnesSectionId,
  ) => {
    const fields = CAMPAGNES_SUBSECTION_FIELDS[subsectionId];
    const subsectionDirty = fields.some((key) => changed(key));
    if (!subsectionDirty) return;

    if (changed("sender") && !draftForm.sender.trim()) {
      setSaveError(t("parametres.senderRequired"));
      return;
    }

    setSaveError(null);
    setSaving(true);
    try {
      await onSaveProfile(draftForm);
      setSavedForm(draftForm);
      toast(t("parametres.savedToast"));
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : t("parametres.saveFailed"),
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
  const inlineCards = sectionCards.filter((c) => !MODAL_SETTINGS.has(c.id));
  const modalCards = sectionCards.filter((c) => MODAL_SETTINGS.has(c.id));
  const sectionDirty = isSectionDirty(sectionId, draftForm, savedForm);
  const sectionDirtyCount = sectionDirtyFieldCount(sectionId, draftForm, savedForm);
  const sectionSaveLabel = sectionSaveLabelKey(sectionId);

  const modalIcon = openCard ? (
    <openCard.icon className="h-5 w-5" strokeWidth={2.25} />
  ) : null;

  const renderInlineSetting = (id: SettingId): ReactNode => {
    switch (id) {
      case "notifications-email":
        return (
          <>
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="param-notify-invoices"
                checked={draftForm.notifyInvoices}
                onCheckedChange={(checked) =>
                  setField("notifyInvoices", checked === true)
                }
                className="mt-0.5"
              />
              <Label
                htmlFor="param-notify-invoices"
                className="text-sm font-semibold leading-snug"
              >
                {t("parametres.field.notifyInvoices")}
              </Label>
            </div>
            <p className="m-0 text-xs font-medium text-muted-foreground">
              {t("parametres.field.notifyInvoicesHint")}
            </p>
          </>
        );
      case "resume-mensuel":
        return (
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="param-notify-summary"
              checked={draftForm.notifySummary}
              onCheckedChange={(checked) =>
                setField("notifySummary", checked === true)
              }
              className="mt-0.5"
            />
            <Label
              htmlFor="param-notify-summary"
              className="text-sm font-semibold leading-snug"
            >
              {t("parametres.field.notifySummary")}
            </Label>
          </div>
        );
      case "abonnement":
        return (
          <p className="m-0 text-xs font-medium text-muted-foreground">
            {t("parametres.abonnementBody")}
          </p>
        );
      case "paiement":
        return (
          <p className="m-0 text-xs font-medium text-muted-foreground">
            {t("parametres.paiementBody")}
          </p>
        );
      default:
        return null;
    }
  };

  const sectionLabel = availableSections.find((s) => s.id === sectionId)
    ? t(sectionTitleKey(sectionId))
    : t("shell.settings");

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-4 lg:flex-row lg:gap-8">
        <nav
          className="-mx-1 flex shrink-0 gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:w-52 lg:flex-col lg:overflow-visible lg:self-stretch lg:border-r lg:border-border lg:px-0 lg:pr-4 lg:pb-0"
          aria-label={t("parametres.sectionsAria")}
        >
          {availableSections.map((section) => {
            const SectionIcon = section.icon;
            return (
              <Button
                key={section.id}
                type="button"
                size="sm"
                variant={sectionId === section.id ? "secondary" : "ghost"}
                aria-current={sectionId === section.id ? "page" : undefined}
                className="shrink-0 justify-start gap-2 lg:w-full"
                onClick={() => setActiveSection(section.id)}
              >
                <SectionIcon
                  className="size-4 shrink-0"
                  strokeWidth={2.25}
                  aria-hidden
                />
                {t(sectionTitleKey(section.id))}
              </Button>
            );
          })}
        </nav>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 flex-col gap-3">
            <h2 className="text-base font-semibold text-foreground">
              {sectionLabel}
            </h2>

            {profileLoading && (
              <p className="m-0 text-sm font-semibold text-muted-foreground">
                <LoadingLabel>{t("parametres.loading")}</LoadingLabel>
              </p>
            )}
            {saveError && (
              <Alert variant="destructive">
                <AlertDescription className="font-bold">
                  {saveError}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pt-3">
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
            ) : sectionId === "entreprise" ? (
              <EntrepriseSettingsPanel
                form={draftForm}
                saving={saving}
                changed={changed}
                onFieldChange={setField}
                onSaveSubsection={onSaveEntrepriseSubsection}
              />
            ) : sectionId === "facturation" ? (
              <div className="flex flex-col gap-6">
                <FacturationSettingsPanel
                  form={draftForm}
                  saving={saving}
                  changed={changed}
                  onFieldChange={setField}
                  onSaveSubsection={onSaveFacturationSubsection}
                />
                {inlineCards
                  .filter((card) => card.id !== "contact-facturation")
                  .map((card) => (
                      <SettingsBlock
                        key={card.id}
                        icon={card.icon}
                        title={t(cardTitleKey(card.id))}
                        description={t(
                          cardDescKey(card.id),
                          cardDescVars(card.id),
                        )}
                        upcoming={
                          card.upcoming ? t("parametres.upcoming") : null
                        }
                      >
                        {renderInlineSetting(card.id)}
                      </SettingsBlock>
                    ))}
                {modalCards.map((card) => (
                  <SettingsModalRow
                    key={card.id}
                    icon={card.icon}
                    title={t(cardTitleKey(card.id))}
                    description={t(
                      cardDescKey(card.id),
                      cardDescVars(card.id),
                    )}
                    openLabel={t("common.open")}
                    onOpen={() => setOpenSetting(card.id)}
                  />
                ))}
              </div>
            ) : sectionId === "campagnes" ? (
              <CampagnesSettingsPanel
                form={draftForm}
                saving={saving}
                changed={changed}
                onFieldChange={setField}
                onSaveSubsection={onSaveCampagnesSubsection}
              />
            ) : (
              <div className="flex flex-col gap-6">
                {inlineCards.map((card) => (
                  <SettingsBlock
                    key={card.id}
                    icon={card.icon}
                    title={t(cardTitleKey(card.id))}
                    description={t(
                      cardDescKey(card.id),
                      cardDescVars(card.id),
                    )}
                    upcoming={card.upcoming ? t("parametres.upcoming") : null}
                  >
                    {renderInlineSetting(card.id)}
                  </SettingsBlock>
                ))}
                {modalCards.map((card) => (
                  <SettingsModalRow
                    key={card.id}
                    icon={card.icon}
                    title={t(cardTitleKey(card.id))}
                    description={t(
                      cardDescKey(card.id),
                      cardDescVars(card.id),
                    )}
                    openLabel={t("common.open")}
                    onOpen={() => setOpenSetting(card.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {sectionDirty &&
          sectionSaveLabel &&
          sectionId !== "entreprise" &&
          sectionId !== "facturation" &&
          sectionId !== "campagnes" ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-background py-3">
              <p className="m-0 text-xs font-medium text-muted-foreground">
                {t("parametres.unsavedHint", { count: sectionDirtyCount })}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={() => revertSectionDraft(sectionId)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={() => void onSaveChanges(sectionId)}
                >
                  {t(sectionSaveLabel)}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {openCard && (
        <ParametresSettingModal
          open={openSetting !== null}
          title={t(cardTitleKey(openCard.id))}
          description={
            openCard.id === "corbeille"
              ? t("trash.description", { days: TRASH_RETENTION_DAYS })
              : t(cardDescKey(openCard.id), cardDescVars(openCard.id))
          }
          icon={modalIcon}
          onClose={handleCloseModal}
          saving={saving}
          wide
          bodyClassName={
            openSetting === "corbeille" || openSetting === "champs-perso"
              ? "flex flex-col overflow-hidden py-2"
              : undefined
          }
        >
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
