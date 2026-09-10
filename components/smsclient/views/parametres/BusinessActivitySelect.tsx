"use client";

import { FormDialogShell } from "@/components/smsclient/modals/FormDialogShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import {
  BUSINESS_ACTIVITIES,
  BUSINESS_CATEGORIES,
  businessActivityLabel,
  businessCategoryLabel,
  businessCategoryOf,
  normalizeBusinessActivityId,
  typesForCategory,
  type BusinessActivityId,
  type BusinessCategoryId,
} from "@/lib/types/businessActivity";
import { Check, Store } from "lucide-react";
import { useState } from "react";

type BusinessActivitySelectProps = {
  value: BusinessActivityId | "";
  onChange: (value: BusinessActivityId | "") => void;
  disabled?: boolean;
  className?: string;
  highlighted?: boolean;
};

type BusinessActivityPickerProps = {
  value: BusinessActivityId | "";
  onChange: (value: BusinessActivityId | "") => void;
  disabled?: boolean;
};

type Step = "category" | "type";

const cardBaseCls =
  "relative flex min-h-[4.25rem] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50";

function cardStateCls(selected: boolean) {
  return selected
    ? "border-ring bg-accent text-ring ring-1 ring-ring/20"
    : "border-border bg-card text-foreground hover:bg-muted/80";
}

function SelectionCheck({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-md border transition-colors",
        selected
          ? "border-ring bg-primary text-primary-foreground"
          : "border-border/80 bg-card",
      )}
      aria-hidden
    >
      {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
    </span>
  );
}

export function BusinessActivityPicker({
  value,
  onChange,
  disabled = false,
}: BusinessActivityPickerProps) {
  const canonical = value ? normalizeBusinessActivityId(value) : null;
  const initialCategory = canonical ? businessCategoryOf(canonical) : null;

  const [step, setStep] = useState<Step>(
    initialCategory ? "type" : "category",
  );
  const [categoryId, setCategoryId] = useState<BusinessCategoryId | null>(
    initialCategory,
  );
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    const next = value ? normalizeBusinessActivityId(value) : null;
    const cat = next ? businessCategoryOf(next) : null;
    if (cat) {
      setCategoryId(cat);
      setStep("type");
    }
  }

  const types = categoryId ? typesForCategory(categoryId) : [];
  const categoryLabel =
    BUSINESS_CATEGORIES.find((c) => c.id === categoryId)?.label ?? "";

  const selectCategory = (id: BusinessCategoryId) => {
    if (canonical && businessCategoryOf(canonical) !== id) {
      onChange("");
    }
    setCategoryId(id);
    setStep("type");
  };

  return (
    <div className="space-y-3">
      {step === "category" || !categoryId ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            1. Choisissez votre secteur
          </Label>
          <div
            className="grid max-h-[min(52dvh,22rem)] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3"
            role="radiogroup"
            aria-label="Secteur d'activité"
          >
            {BUSINESS_CATEGORIES.map((category) => {
              const selected = categoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() =>
                    selectCategory(category.id as BusinessCategoryId)
                  }
                  className={cn(cardBaseCls, cardStateCls(selected))}
                >
                  <SelectionCheck selected={selected} />
                  <span className="text-xl leading-none" aria-hidden>
                    {category.emoji}
                  </span>
                  <span className="text-xs font-medium leading-snug">
                    {category.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">
              2. {categoryLabel} — type d&apos;activité
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => setStep("category")}
              className="h-7 shrink-0 cursor-pointer px-2.5 text-xs"
            >
              Changer de secteur
            </Button>
          </div>

          <div
            className="grid max-h-[min(52dvh,22rem)] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3"
            role="radiogroup"
            aria-label={`Type d'activité — ${categoryLabel}`}
          >
            {types.map((activity) => {
              const selected = canonical === activity.id;
              return (
                <button
                  key={activity.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => onChange(activity.id as BusinessActivityId)}
                  className={cn(cardBaseCls, cardStateCls(selected))}
                >
                  <SelectionCheck selected={selected} />
                  <span className="text-xl leading-none" aria-hidden>
                    {activity.emoji}
                  </span>
                  <span className="text-xs font-medium leading-snug">
                    {activity.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function BusinessActivitySelect({
  value,
  onChange,
  disabled = false,
  className,
  highlighted = false,
}: BusinessActivitySelectProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const canonical = value ? normalizeBusinessActivityId(value) : null;
  const activity = canonical
    ? BUSINESS_ACTIVITIES.find((entry) => entry.id === canonical)
    : null;
  const categoryId = canonical ? businessCategoryOf(canonical) : null;

  const handlePick = (next: BusinessActivityId | "") => {
    if (!next) return;
    onChange(next);
    setOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5",
          highlighted && "ring-2 ring-ring/30",
          disabled && "opacity-50",
          className,
        )}
      >
        <div className="min-w-0 flex-1">
          {activity && categoryId ? (
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="text-xl leading-none" aria-hidden>
                {activity.emoji}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {businessActivityLabel(activity.id)}
                </p>
                <p className="truncate text-xs font-medium text-muted-foreground">
                  {businessCategoryLabel(categoryId)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium text-muted-foreground">
              {t("parametres.businessActivity.empty")}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="shrink-0"
          onClick={() => setOpen(true)}
        >
          {activity
            ? t("parametres.businessActivity.change")
            : t("parametres.businessActivity.choose")}
        </Button>
      </div>

      <FormDialogShell
        open={open}
        title={t("parametres.businessActivity.modalTitle")}
        description={t("parametres.businessActivity.modalDescription")}
        icon={<Store className="h-5 w-5" strokeWidth={2.25} />}
        wide
        onClose={() => setOpen(false)}
        bodyClassName="py-2"
      >
        <BusinessActivityPicker
          value={value}
          onChange={handlePick}
          disabled={disabled}
        />
      </FormDialogShell>
    </>
  );
}
