"use client";

import { BusinessActivitySelect } from "@/components/smsclient/views/parametres/BusinessActivitySelect";
import {
  parametresDirtyInp,
  parametresFieldLbl,
} from "@/components/smsclient/views/parametres/parametresSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import {
  ADDRESS_MAX_LENGTH,
  CITY_MAX_LENGTH,
  COMPANY_NAME_MAX_LENGTH,
  COUNTRY_MAX_LENGTH,
  SIRET_MAX_LENGTH,
  VAT_MAX_LENGTH,
  ZIP_MAX_LENGTH,
} from "@/lib/forms/fieldLimits";
import {
  entrepriseFieldErrorKey,
  firstEntrepriseSubsectionErrorKey,
  normalizePostalCodeInput,
  normalizeSiretInput,
  normalizeVatInput,
  type EntrepriseFormField,
} from "@/lib/forms/entrepriseValidation";
import { useI18n } from "@/lib/i18n";
import type { UserProfileForm } from "@/lib/types/profile";
import {
  Building2,
  ChevronDown,
  Hash,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

export type EntrepriseSectionId =
  | "entreprise"
  | "identifiants-legaux"
  | "adresse-facturation";

export const ENTREPRISE_SUBSECTION_FIELDS: Record<
  EntrepriseSectionId,
  readonly (keyof UserProfileForm)[]
> = {
  entreprise: ["companyName", "businessActivity"],
  "identifiants-legaux": ["siret", "tva"],
  "adresse-facturation": ["address", "zip", "city", "country"],
};

const invalidInputCls =
  "focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0";

function SettingsField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className={parametresFieldLbl}>
        {label}
      </Label>
      {children}
      {error ? (
        <p className="m-0 text-xs font-medium text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

function EntrepriseSection({
  sectionId,
  icon: Icon,
  title,
  description,
  open,
  dirty,
  saving,
  onToggle,
  onSave,
  children,
}: {
  sectionId: EntrepriseSectionId;
  icon: LucideIcon;
  title: string;
  description: string;
  open: boolean;
  dirty: boolean;
  saving: boolean;
  onToggle: () => void;
  onSave: () => void | Promise<void>;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const panelId = `entreprise-section-${sectionId}`;

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className={cn(
          "flex w-full cursor-pointer items-start gap-2.5 px-3 py-3 text-left transition-colors duration-200",
          !open && "hover:bg-muted/50",
        )}
      >
        <Icon
          className="mt-0.5 size-4 shrink-0 text-ring"
          strokeWidth={2.25}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {!open ? (
            <p className="mt-0.5 line-clamp-1 text-xs font-medium leading-snug text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-in-out",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div
            id={panelId}
            role="region"
            aria-labelledby={`${panelId}-trigger`}
            className={cn(
              "border-t border-border px-3 pb-3 pt-3 transition-opacity duration-300 ease-in-out",
              open ? "opacity-100" : "opacity-0",
            )}
          >
            <p className="mb-3 text-xs font-medium leading-snug text-muted-foreground">
              {description}
            </p>
            <div className="grid min-w-0 gap-3">{children}</div>
            <div className="mt-4 flex justify-end border-t border-border pt-3">
              <Button
                type="button"
                size="sm"
                disabled={saving || !dirty}
                onClick={() => void onSave()}
              >
                {saving ? t("dialog.saving") : t("dialog.save")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type EntrepriseSettingsPanelProps = {
  form: UserProfileForm;
  saving?: boolean;
  changed: (key: keyof UserProfileForm) => boolean;
  onFieldChange: <K extends keyof UserProfileForm>(
    key: K,
    value: UserProfileForm[K],
  ) => void;
  onSaveSubsection: (sectionId: EntrepriseSectionId) => void | Promise<void>;
};

export function EntrepriseSettingsPanel({
  form,
  saving = false,
  changed,
  onFieldChange,
  onSaveSubsection,
}: EntrepriseSettingsPanelProps) {
  const { t } = useI18n();
  const [openSection, setOpenSection] = useState<EntrepriseSectionId | null>(
    null,
  );
  const [touched, setTouched] = useState<
    Partial<Record<EntrepriseFormField, boolean>>
  >({});
  const [submitSection, setSubmitSection] =
    useState<EntrepriseSectionId | null>(null);

  const toggleSection = (id: EntrepriseSectionId) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const isOpen = (id: EntrepriseSectionId) => openSection === id;

  const isSubsectionDirty = (id: EntrepriseSectionId) =>
    ENTREPRISE_SUBSECTION_FIELDS[id].some((key) => changed(key));

  const markTouched = (field: EntrepriseFormField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const fieldError = (
    field: EntrepriseFormField,
    sectionId: EntrepriseSectionId,
  ): string | null => {
    if (!touched[field] && submitSection !== sectionId) return null;
    const key = entrepriseFieldErrorKey(field, form);
    return key ? t(key) : null;
  };

  const handleSaveSubsection = (sectionId: EntrepriseSectionId) => {
    setSubmitSection(sectionId);
    setTouched((prev) => {
      const next = { ...prev };
      for (const field of ENTREPRISE_SUBSECTION_FIELDS[sectionId]) {
        next[field as EntrepriseFormField] = true;
      }
      return next;
    });

    const errorKey = firstEntrepriseSubsectionErrorKey(
      ENTREPRISE_SUBSECTION_FIELDS[sectionId],
      form,
    );
    if (errorKey) return;

    setSubmitSection(null);
    void onSaveSubsection(sectionId);
  };

  return (
    <div className="flex flex-col gap-2">
      <EntrepriseSection
        sectionId="entreprise"
        icon={Building2}
        title={t("parametres.card.entreprise.title")}
        description={t("parametres.card.entreprise.description")}
        open={isOpen("entreprise")}
        dirty={isSubsectionDirty("entreprise")}
        saving={saving}
        onToggle={() => toggleSection("entreprise")}
        onSave={() => handleSaveSubsection("entreprise")}
      >
        <SettingsField
          id="param-company-name"
          label={t("parametres.field.companyName")}
        >
          <Input
            id="param-company-name"
            className={cn(
              invalidInputCls,
              changed("companyName") && parametresDirtyInp,
            )}
            maxLength={COMPANY_NAME_MAX_LENGTH}
            value={form.companyName}
            onChange={(e) => onFieldChange("companyName", e.target.value)}
          />
        </SettingsField>
        <div className="grid gap-1.5">
          <Label className={parametresFieldLbl}>
            {t("parametres.field.businessActivity")}
          </Label>
          <BusinessActivitySelect
            value={form.businessActivity}
            onChange={(activityId) =>
              onFieldChange("businessActivity", activityId)
            }
            highlighted={changed("businessActivity")}
          />
        </div>
      </EntrepriseSection>

      <EntrepriseSection
        sectionId="identifiants-legaux"
        icon={Hash}
        title={t("parametres.card.identifiants-legaux.title")}
        description={t("parametres.card.identifiants-legaux.description")}
        open={isOpen("identifiants-legaux")}
        dirty={isSubsectionDirty("identifiants-legaux")}
        saving={saving}
        onToggle={() => toggleSection("identifiants-legaux")}
        onSave={() => handleSaveSubsection("identifiants-legaux")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SettingsField
            id="param-siret"
            label={t("parametres.field.siret")}
            error={fieldError("siret", "identifiants-legaux")}
          >
            <Input
              id="param-siret"
              inputMode="numeric"
              autoComplete="off"
              className={cn(
                invalidInputCls,
                changed("siret") && parametresDirtyInp,
              )}
              maxLength={SIRET_MAX_LENGTH}
              aria-invalid={Boolean(fieldError("siret", "identifiants-legaux"))}
              value={form.siret}
              onBlur={() => markTouched("siret")}
              onChange={(e) =>
                onFieldChange("siret", normalizeSiretInput(e.target.value))
              }
            />
          </SettingsField>
          <SettingsField
            id="param-tva"
            label={t("parametres.field.tva")}
            error={fieldError("tva", "identifiants-legaux")}
          >
            <Input
              id="param-tva"
              autoComplete="off"
              className={cn(
                invalidInputCls,
                changed("tva") && parametresDirtyInp,
              )}
              maxLength={VAT_MAX_LENGTH}
              aria-invalid={Boolean(fieldError("tva", "identifiants-legaux"))}
              value={form.tva}
              onBlur={() => markTouched("tva")}
              onChange={(e) =>
                onFieldChange("tva", normalizeVatInput(e.target.value))
              }
            />
          </SettingsField>
        </div>
      </EntrepriseSection>

      <EntrepriseSection
        sectionId="adresse-facturation"
        icon={MapPin}
        title={t("parametres.card.adresse-facturation.title")}
        description={t("parametres.card.adresse-facturation.description")}
        open={isOpen("adresse-facturation")}
        dirty={isSubsectionDirty("adresse-facturation")}
        saving={saving}
        onToggle={() => toggleSection("adresse-facturation")}
        onSave={() => handleSaveSubsection("adresse-facturation")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SettingsField
              id="param-address"
              label={t("parametres.field.address")}
            >
              <Input
                id="param-address"
                className={cn(
                  invalidInputCls,
                  changed("address") && parametresDirtyInp,
                )}
                maxLength={ADDRESS_MAX_LENGTH}
                value={form.address}
                onChange={(e) => onFieldChange("address", e.target.value)}
              />
            </SettingsField>
          </div>
          <SettingsField
            id="param-zip"
            label={t("parametres.field.zip")}
            error={fieldError("zip", "adresse-facturation")}
          >
            <Input
              id="param-zip"
              inputMode="text"
              autoComplete="postal-code"
              className={cn(
                invalidInputCls,
                changed("zip") && parametresDirtyInp,
              )}
              maxLength={ZIP_MAX_LENGTH}
              aria-invalid={Boolean(fieldError("zip", "adresse-facturation"))}
              value={form.zip}
              onBlur={() => markTouched("zip")}
              onChange={(e) =>
                onFieldChange(
                  "zip",
                  normalizePostalCodeInput(e.target.value, form.country),
                )
              }
            />
          </SettingsField>
          <SettingsField id="param-city" label={t("parametres.field.city")}>
            <Input
              id="param-city"
              className={cn(
                invalidInputCls,
                changed("city") && parametresDirtyInp,
              )}
              maxLength={CITY_MAX_LENGTH}
              value={form.city}
              onChange={(e) => onFieldChange("city", e.target.value)}
            />
          </SettingsField>
          <SettingsField
            id="param-country"
            label={t("parametres.field.country")}
          >
            <Input
              id="param-country"
              className={cn(
                invalidInputCls,
                changed("country") && parametresDirtyInp,
              )}
              maxLength={COUNTRY_MAX_LENGTH}
              value={form.country}
              onChange={(e) => onFieldChange("country", e.target.value)}
            />
          </SettingsField>
        </div>
      </EntrepriseSection>
    </div>
  );
}
