"use client";

import { CountryFlag } from "@/components/smsclient/CountryFlag";
import { BusinessActivitySelect } from "@/components/smsclient/views/parametres/BusinessActivitySelect";
import {
  ParametresInputRow,
  parametresControlCls,
} from "@/components/smsclient/views/parametres/ParametresInputRow";
import {
  parametresFieldStackCls,
  parametresToastError,
} from "@/components/smsclient/views/parametres/parametresSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";
import {
  ADDRESS_MAX_LENGTH,
  CITY_MAX_LENGTH,
  COMPANY_NAME_MAX_LENGTH,
  SIRET_MAX_LENGTH,
  VAT_MAX_LENGTH,
  ZIP_MAX_LENGTH,
} from "@/lib/forms/fieldLimits";
import {
  BILLING_COUNTRY_STORED_VALUES,
  firstEntrepriseSubsectionErrorKey,
  normalizeBillingCountry,
  normalizePostalCodeInput,
  normalizeSiretInput,
  normalizeVatInput,
} from "@/lib/forms/entrepriseValidation";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import type { SmsRegulationCountry } from "@/lib/proto/smsRegulations";
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

const BILLING_COUNTRY_OPTIONS: {
  id: SmsRegulationCountry;
  storedValue: (typeof BILLING_COUNTRY_STORED_VALUES)[number];
  labelKey: MessageKey;
}[] = [
  { id: "fr", storedValue: "France", labelKey: "regs.country.fr" },
  { id: "be", storedValue: "Belgique", labelKey: "regs.country.be" },
  { id: "ch", storedValue: "Suisse", labelKey: "regs.country.ch" },
];

export const ENTREPRISE_SUBSECTION_FIELDS: Record<
  EntrepriseSectionId,
  readonly (keyof UserProfileForm)[]
> = {
  entreprise: ["companyName", "businessActivity"],
  "identifiants-legaux": ["siret", "tva"],
  "adresse-facturation": ["address", "zip", "city", "country"],
};

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
            <div className={cn("grid min-w-0 gap-0", parametresFieldStackCls)}>
              {children}
            </div>
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
  const billingCountryValue = normalizeBillingCountry(form.country);
  const [openSection, setOpenSection] = useState<EntrepriseSectionId | null>(
    null,
  );

  const toggleSection = (id: EntrepriseSectionId) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const isOpen = (id: EntrepriseSectionId) => openSection === id;

  const isSubsectionDirty = (id: EntrepriseSectionId) =>
    ENTREPRISE_SUBSECTION_FIELDS[id].some((key) => changed(key));

  const handleSaveSubsection = (sectionId: EntrepriseSectionId) => {
    if (sectionId === "entreprise") {
      if (changed("companyName") && !form.companyName.trim()) {
        parametresToastError(t("parametres.companyNameRequired"));
        return;
      }
      if (changed("businessActivity") && !form.businessActivity) {
        parametresToastError(t("parametres.activityRequired"));
        return;
      }
    }

    const errorKey = firstEntrepriseSubsectionErrorKey(
      ENTREPRISE_SUBSECTION_FIELDS[sectionId],
      form,
    );
    if (errorKey) {
      parametresToastError(t(errorKey));
      return;
    }

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
        <ParametresInputRow
          id="param-company-name"
          label={t("parametres.field.companyName")}
          leading={
            <Building2
              className="h-4 w-4 shrink-0 text-ring"
              strokeWidth={2.25}
              aria-hidden
            />
          }
        >
          <Input
            id="param-company-name"
            className={parametresControlCls(changed("companyName"))}
            maxLength={COMPANY_NAME_MAX_LENGTH}
            value={form.companyName}
            onChange={(e) => onFieldChange("companyName", e.target.value)}
          />
        </ParametresInputRow>
        <ParametresInputRow
          label={t("parametres.field.businessActivity")}
          alignTop
        >
          <BusinessActivitySelect
            value={form.businessActivity}
            onChange={(activityId) =>
              onFieldChange("businessActivity", activityId)
            }
            highlighted={changed("businessActivity")}
          />
        </ParametresInputRow>
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
        <ParametresInputRow
          id="param-siret"
          label={t("parametres.field.siret")}
          leading={
            <Hash
              className="h-4 w-4 shrink-0 text-ring"
              strokeWidth={2.25}
              aria-hidden
            />
          }
        >
          <Input
            id="param-siret"
            inputMode="numeric"
            autoComplete="off"
            className={parametresControlCls(changed("siret"))}
            maxLength={SIRET_MAX_LENGTH}
            value={form.siret}
            onChange={(e) =>
              onFieldChange("siret", normalizeSiretInput(e.target.value))
            }
          />
        </ParametresInputRow>
        <ParametresInputRow
          id="param-tva"
          label={t("parametres.field.tva")}
        >
          <Input
            id="param-tva"
            autoComplete="off"
            className={parametresControlCls(changed("tva"))}
            maxLength={VAT_MAX_LENGTH}
            value={form.tva}
            onChange={(e) =>
              onFieldChange("tva", normalizeVatInput(e.target.value))
            }
          />
        </ParametresInputRow>
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
        <ParametresInputRow
          id="param-address"
          label={t("parametres.field.address")}
          leading={
            <MapPin
              className="h-4 w-4 shrink-0 text-ring"
              strokeWidth={2.25}
              aria-hidden
            />
          }
        >
          <Input
            id="param-address"
            className={parametresControlCls(changed("address"))}
            maxLength={ADDRESS_MAX_LENGTH}
            value={form.address}
            onChange={(e) => onFieldChange("address", e.target.value)}
          />
        </ParametresInputRow>
        <ParametresInputRow
          id="param-zip"
          label={t("parametres.field.zip")}
        >
          <Input
            id="param-zip"
            inputMode="text"
            autoComplete="postal-code"
            className={parametresControlCls(changed("zip"))}
            maxLength={ZIP_MAX_LENGTH}
            value={form.zip}
            onChange={(e) =>
              onFieldChange(
                "zip",
                normalizePostalCodeInput(e.target.value, form.country),
              )
            }
          />
        </ParametresInputRow>
        <ParametresInputRow id="param-city" label={t("parametres.field.city")}>
          <Input
            id="param-city"
            className={parametresControlCls(changed("city"))}
            maxLength={CITY_MAX_LENGTH}
            value={form.city}
            onChange={(e) => onFieldChange("city", e.target.value)}
          />
        </ParametresInputRow>
        <ParametresInputRow
          id="param-country"
          label={t("parametres.field.country")}
        >
          <Select
            value={billingCountryValue || undefined}
            disabled={saving}
            onValueChange={(value) => {
              onFieldChange("country", value);
              if (form.zip) {
                onFieldChange(
                  "zip",
                  normalizePostalCodeInput(form.zip, value),
                );
              }
            }}
          >
            <SelectTrigger
              id="param-country"
              className={cn(
                "w-full cursor-pointer",
                parametresControlCls(changed("country")),
              )}
            >
              <SelectValue placeholder={t("parametres.field.country")} />
            </SelectTrigger>
            <SelectContent align="start">
              {BILLING_COUNTRY_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.id}
                  value={opt.storedValue}
                  textValue={t(opt.labelKey)}
                >
                  <span className="flex items-center gap-2">
                    <CountryFlag country={opt.id} className="h-4 w-[1.35rem]" />
                    <span>{t(opt.labelKey)}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ParametresInputRow>
      </EntrepriseSection>
    </div>
  );
}
