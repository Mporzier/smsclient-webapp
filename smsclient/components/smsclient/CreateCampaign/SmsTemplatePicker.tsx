"use client";

import { cn } from "@/lib/cn";
import {
  CAMPAIGN_SMS_TEMPLATES,
  type CampaignSmsTemplate,
} from "@/lib/proto/campaignSmsTemplates";

type SmsTemplatePickerProps = {
  selectedId: string | null;
  onSelect: (template: CampaignSmsTemplate) => void;
};

export function SmsTemplatePicker({ selectedId, onSelect }: SmsTemplatePickerProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {CAMPAIGN_SMS_TEMPLATES.map((template) => {
        const selected = selectedId === template.id;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={cn(
              "cursor-pointer rounded-xl border p-3 text-left transition-colors",
              selected
                ? "border-[#2f6fed] bg-[#eef4ff] ring-1 ring-[#2f6fed]/20"
                : "border-slate-200 bg-white hover:border-slate-300",
            )}
          >
            <span className="block text-xs font-black text-slate-900">
              {template.title}
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold leading-snug text-slate-500">
              {template.description}
            </span>
            <span className="mt-2 line-clamp-2 text-[10px] font-medium leading-snug text-slate-400">
              {template.body}
            </span>
          </button>
        );
      })}
    </div>
  );
}
