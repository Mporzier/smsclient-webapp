"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingLabel } from "@/components/ui/loading-label";
import { ParametresSettingModal } from "@/components/smsclient/modals/ParametresSettingModal";
import { cn } from "@/lib/cn";
import { ParametresTrashSection } from "@/components/smsclient/views/ParametresTrashSection";
import { TRASH_RETENTION_DAYS } from "@/lib/proto/trashRetention";
import { ApparenceSettingsPanel } from "@/components/smsclient/views/parametres/ApparenceSettingsPanel";
import { CompteSettingsPanel } from "@/components/smsclient/views/parametres/CompteSettingsPanel";
import { CustomFieldsSettingsPanel } from "@/components/smsclient/views/parametres/CustomFieldsSettingsPanel";
import { InvoicesTable } from "@/components/smsclient/views/parametres/InvoicesTable";
import {
  allSettingCards,
  emptyProfileForm,
  parametresDirtyInp,
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
import {
  ADDRESS_MAX_LENGTH,
  BILLING_CONTACT_MAX_LENGTH,
  CITY_MAX_LENGTH,
  COMPANY_NAME_MAX_LENGTH,
  COUNTRY_MAX_LENGTH,
  SIRET_MAX_LENGTH,
  VAT_MAX_LENGTH,
  ZIP_MAX_LENGTH,
  SMS_SENDER_MAX_LENGTH,
} from "@/lib/forms/fieldLimits";
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

function SettingsField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className={parametresFieldLbl}>
        {label}
      </Label>
      {children}
    </div>
  );
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

  const validateBeforeSave = (): string | null => {
    if (changed("companyName") && !draftForm.companyName.trim()) {
      return t("parametres.companyNameRequired");
    }
    if (changed("businessActivity") && !draftForm.businessActivity) {
      return t("parametres.activityRequired");
    }
    if (changed("sender") && !draftForm.sender.trim()) {
      return t("parametres.senderRequired");
    }
    return null;
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
      setOpenSetting(null);
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
  const inlineCards = sectionCards.filter((c) => !MODAL_SETTINGS.has(c.id));
  const modalCards = sectionCards.filter((c) => MODAL_SETTINGS.has(c.id));

  const modalIcon = openCard ? (
    <openCard.icon className="h-5 w-5" strokeWidth={2.25} />
  ) : null;

  const renderInlineSetting = (id: SettingId): ReactNode => {
    switch (id) {
      case "entreprise":
        return (
          <>
            <SettingsField
              id="param-company-name"
              label={t("parametres.field.companyName")}
            >
              <Input
                id="param-company-name"
                className={cn(changed("companyName") && parametresDirtyInp)}
                maxLength={COMPANY_NAME_MAX_LENGTH}
                value={draftForm.companyName}
                onChange={(e) => setField("companyName", e.target.value)}
              />
            </SettingsField>
            <div className="grid gap-1.5">
              <Label className={parametresFieldLbl}>
                {t("parametres.field.businessActivity")}
              </Label>
              <BusinessActivitySelect
                value={draftForm.businessActivity}
                onChange={(activityId) =>
                  setField("businessActivity", activityId)
                }
                highlighted={changed("businessActivity")}
              />
            </div>
          </>
        );
      case "identifiants-legaux":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <SettingsField id="param-siret" label={t("parametres.field.siret")}>
              <Input
                id="param-siret"
                className={cn(changed("siret") && parametresDirtyInp)}
                maxLength={SIRET_MAX_LENGTH}
                value={draftForm.siret}
                onChange={(e) => setField("siret", e.target.value)}
              />
            </SettingsField>
            <SettingsField id="param-tva" label={t("parametres.field.tva")}>
              <Input
                id="param-tva"
                className={cn(changed("tva") && parametresDirtyInp)}
                maxLength={VAT_MAX_LENGTH}
                value={draftForm.tva}
                onChange={(e) => setField("tva", e.target.value)}
              />
            </SettingsField>
          </div>
        );
      case "adresse-facturation":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <SettingsField
                id="param-address"
                label={t("parametres.field.address")}
              >
                <Input
                  id="param-address"
                  className={cn(changed("address") && parametresDirtyInp)}
                  maxLength={ADDRESS_MAX_LENGTH}
                  value={draftForm.address}
                  onChange={(e) => setField("address", e.target.value)}
                />
              </SettingsField>
            </div>
            <SettingsField id="param-zip" label={t("parametres.field.zip")}>
              <Input
                id="param-zip"
                className={cn(changed("zip") && parametresDirtyInp)}
                maxLength={ZIP_MAX_LENGTH}
                value={draftForm.zip}
                onChange={(e) => setField("zip", e.target.value)}
              />
            </SettingsField>
            <SettingsField id="param-city" label={t("parametres.field.city")}>
              <Input
                id="param-city"
                className={cn(changed("city") && parametresDirtyInp)}
                maxLength={CITY_MAX_LENGTH}
                value={draftForm.city}
                onChange={(e) => setField("city", e.target.value)}
              />
            </SettingsField>
            <SettingsField
              id="param-country"
              label={t("parametres.field.country")}
            >
              <Input
                id="param-country"
                className={cn(changed("country") && parametresDirtyInp)}
                maxLength={COUNTRY_MAX_LENGTH}
                value={draftForm.country}
                onChange={(e) => setField("country", e.target.value)}
              />
            </SettingsField>
          </div>
        );
      case "contact-facturation":
        return (
          <SettingsField
            id="param-billing-contact"
            label={t("parametres.field.billingContact")}
          >
            <Input
              id="param-billing-contact"
              className={cn(changed("billingContact") && parametresDirtyInp)}
              maxLength={BILLING_CONTACT_MAX_LENGTH}
              value={draftForm.billingContact}
              onChange={(e) => setField("billingContact", e.target.value)}
              placeholder={t("parametres.field.billingContactPlaceholder")}
            />
          </SettingsField>
        );
      case "expediteur-sms":
        return (
          <>
            <SettingsField
              id="param-sender"
              label={t("parametres.field.sender")}
            >
              <Input
                id="param-sender"
                className={cn(changed("sender") && parametresDirtyInp)}
                maxLength={SMS_SENDER_MAX_LENGTH}
                value={draftForm.sender}
                onChange={(e) => setField("sender", e.target.value)}
                placeholder="BOULANGERIE"
                autoComplete="off"
              />
            </SettingsField>
            <p className="m-0 text-xs font-medium text-muted-foreground">
              {t("parametres.field.senderHint")}
            </p>
          </>
        );
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        <nav
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:w-52 lg:shrink-0 lg:flex-col lg:overflow-visible lg:border-r lg:border-border lg:px-0 lg:pr-4 lg:pb-0"
          aria-label={t("parametres.sectionsAria")}
        >
          {availableSections.map((section) => (
            <Button
              key={section.id}
              type="button"
              size="sm"
              variant={sectionId === section.id ? "secondary" : "ghost"}
              aria-current={sectionId === section.id ? "page" : undefined}
              className="shrink-0 justify-start lg:w-full"
              onClick={() => setActiveSection(section.id)}
            >
              {t(sectionTitleKey(section.id))}
            </Button>
          ))}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
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
            <div className="flex flex-col gap-6">
              {inlineCards.map((card) => (
                <SettingsBlock
                  key={card.id}
                  icon={card.icon}
                  title={t(cardTitleKey(card.id))}
                  description={t(cardDescKey(card.id), cardDescVars(card.id))}
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
                  description={t(cardDescKey(card.id), cardDescVars(card.id))}
                  openLabel={t("common.open")}
                  onOpen={() => setOpenSetting(card.id)}
                />
              ))}
            </div>
          )}

          {dirty && (
            <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t border-border bg-background/95 py-3 backdrop-blur">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={saving}
                onClick={() => {
                  setDraftForm(savedForm);
                  setSaveError(null);
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={() => void onSaveChanges()}
              >
                {t("dialog.save")}
              </Button>
            </div>
          )}
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
