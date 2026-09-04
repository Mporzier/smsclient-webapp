"use client";

import { cn } from "@/lib/cn";
import { AI_PROMPT_MAX_LENGTH } from "@/lib/forms/fieldLimits";

type SmsAiPromptFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hasError?: boolean;
  disabled?: boolean;
};

export function SmsAiPromptField({
  value,
  onChange,
  placeholder,
  hasError = false,
  disabled = false,
}: SmsAiPromptFieldProps) {
  return (
    <div className="mt-2.5 shrink-0">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border bg-gradient-to-b from-white to-slate-50/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-shadow",
          hasError
            ? "border-rose-300 ring-2 ring-rose-100"
            : "border-[#dfe6f2] focus-within:border-[#2f6fed]/40 focus-within:ring-2 focus-within:ring-[#2f6fed]/15",
        )}
      >
        <textarea
          value={value}
          disabled={disabled}
          maxLength={AI_PROMPT_MAX_LENGTH}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={cn(
            "block min-h-28 w-full resize-none border-none bg-transparent px-3.5 py-3.5",
            "text-sm font-semibold leading-relaxed text-slate-900 outline-none",
            "placeholder:font-normal placeholder:leading-relaxed placeholder:text-muted-foreground/40",
            disabled && "cursor-not-allowed opacity-60",
          )}
        />
      </div>
    </div>
  );
}
