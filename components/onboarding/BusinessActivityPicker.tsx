"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import {
  BUSINESS_CATEGORIES,
  type BusinessActivityId,
  type BusinessCategoryId,
  businessActivityLabel,
  businessCategoryOf,
  normalizeBusinessActivityId,
  typesForCategory,
} from "@/lib/types/businessActivity";

type BusinessActivityPickerProps = {
  value: BusinessActivityId | "";
  onChange: (value: BusinessActivityId | "") => void;
  disabled?: boolean;
};

type Step = "category" | "type";

export function BusinessActivityPicker({
  value,
  onChange,
  disabled = false,
}: BusinessActivityPickerProps) {
  const canonical = value ? normalizeBusinessActivityId(value) : null;
  const initialCategory = canonical
    ? businessCategoryOf(canonical)
    : null;

  const [step, setStep] = useState<Step>(
    initialCategory ? "type" : "category",
  );
  const [categoryId, setCategoryId] = useState<BusinessCategoryId | null>(
    initialCategory,
  );

  useEffect(() => {
    const next = value ? normalizeBusinessActivityId(value) : null;
    const cat = next ? businessCategoryOf(next) : null;
    if (cat) {
      setCategoryId(cat);
      setStep("type");
    }
  }, [value]);

  const types = categoryId ? typesForCategory(categoryId) : [];

  const selectCategory = (id: BusinessCategoryId) => {
    if (canonical && businessCategoryOf(canonical) !== id) {
      onChange("");
    }
    setCategoryId(id);
    setStep("type");
  };

  if (step === "category" || !categoryId) {
    return (
      <div className="space-y-2.5">
        <p className="m-0 text-xs font-semibold text-slate-600">
          1. Choisissez votre secteur
        </p>
        <div
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
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
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-2xl border px-2 py-3.5 text-center transition-all",
                  selected
                    ? "border-2 border-[#2f6fed] bg-[#eef4ff]/50 shadow-[0_4px_16px_rgba(47,111,237,0.12)]"
                    : "border-slate-200 bg-white hover:border-[#2f6fed]/30 hover:bg-[#eef4ff]/25",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="text-2xl leading-none" aria-hidden>
                  {category.emoji}
                </span>
                <span className="mt-2 text-[11px] font-black leading-snug text-slate-900">
                  {category.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const categoryLabel =
    BUSINESS_CATEGORIES.find((c) => c.id === categoryId)?.label ?? "";

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 text-xs font-semibold text-slate-600">
          2. {categoryLabel} — type d&apos;activité
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setStep("category")}
          className={cn(
            "shrink-0 text-xs font-bold text-[#2f6fed] hover:underline",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          Changer de secteur
        </button>
      </div>
      {canonical ? (
        <p className="m-0 rounded-xl border border-[#2f6fed]/25 bg-[#eef4ff]/60 px-3 py-2 text-xs font-bold text-slate-800">
          Sélection : {businessActivityLabel(canonical)}
        </p>
      ) : null}
      <div
        className="grid max-h-72 grid-cols-2 gap-2.5 overflow-y-auto sm:grid-cols-3"
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
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-2xl border px-2 py-3.5 text-center transition-all",
                selected
                  ? "border-2 border-[#2f6fed] bg-[#eef4ff]/50 shadow-[0_4px_16px_rgba(47,111,237,0.12)]"
                  : "border-slate-200 bg-white hover:border-[#2f6fed]/30 hover:bg-[#eef4ff]/25",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <span className="text-2xl leading-none" aria-hidden>
                {activity.emoji}
              </span>
              <span className="mt-2 text-[11px] font-black leading-snug text-slate-900">
                {activity.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
