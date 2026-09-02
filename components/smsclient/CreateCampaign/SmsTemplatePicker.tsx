"use client";

import { cn } from "@/lib/cn";
import {
  getCampaignSmsTemplatesForActivity,
  type CampaignSmsTemplate,
} from "@/lib/proto/campaignSmsTemplates";
import type { BusinessActivityId } from "@/lib/types/businessActivity";
import { businessActivityLabel } from "@/lib/types/businessActivity";
import {
  toCampaignSmsTemplate,
  type UserSmsTemplateRow,
} from "@/lib/types/smsTemplate";
import { LoadingLabel } from "@/components/ui/loading-label";
import { LayoutTemplate } from "lucide-react";

type SmsTemplatePickerProps = {
  selectedId: string | null;
  onSelect: (template: CampaignSmsTemplate) => void;
  businessActivity?: BusinessActivityId | "";
  customTemplates?: UserSmsTemplateRow[];
  customLoading?: boolean;
  onManageCustomTemplates?: () => void;
  onCreateCustomTemplate?: () => void;
};

function TemplateCard({
  template,
  selected,
  onSelect,
  badge,
}: {
  template: CampaignSmsTemplate;
  selected: boolean;
  onSelect: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "cursor-pointer rounded-xl border p-3 text-left transition-colors",
        selected
          ? "border-[#2f6fed] bg-[#eef4ff] ring-1 ring-[#2f6fed]/20"
          : "border-slate-200 bg-white hover:border-slate-300",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="block text-xs font-black text-slate-900">
          {template.title}
        </span>
        {badge ? (
          <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-500">
            {badge}
          </span>
        ) : null}
      </div>
      <span className="mt-0.5 block text-[10px] font-semibold leading-snug text-slate-500">
        {template.description}
      </span>
      <span className="mt-2 line-clamp-2 text-[10px] font-medium leading-snug text-slate-400">
        {template.body}
      </span>
    </button>
  );
}

export function SmsTemplatePicker({
  selectedId,
  onSelect,
  businessActivity = "",
  customTemplates = [],
  customLoading = false,
  onManageCustomTemplates,
  onCreateCustomTemplate,
}: SmsTemplatePickerProps) {
  const readyTemplates = getCampaignSmsTemplatesForActivity(businessActivity);
  const sectorLabel = businessActivity
    ? businessActivityLabel(businessActivity)
    : businessActivityLabel("autre");
  const personalTemplates = customTemplates.map(toCampaignSmsTemplate);
  const handleCreate = onCreateCustomTemplate ?? onManageCustomTemplates;

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <div>
          <h3 className="m-0 text-xs font-black text-slate-900">
            Modèles prêts à l&apos;emploi
          </h3>
          <p className="m-0 mt-0.5 text-[11px] font-semibold text-slate-500">
            6 modèles pour{" "}
            <span className="font-black text-slate-700">{sectorLabel}</span>
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {readyTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selectedId === template.id}
              onSelect={() => onSelect(template)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-2 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="m-0 text-xs font-black text-slate-900">
              Mes modèles
            </h3>
            <p className="m-0 mt-0.5 text-[11px] font-semibold text-slate-500">
              Vos modèles personnalisés enregistrés.
            </p>
          </div>
          {onManageCustomTemplates ? (
            <button
              type="button"
              onClick={onManageCustomTemplates}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-[#2f6fed] hover:border-[#2f6fed]/30 hover:bg-[#eef4ff]"
            >
              Gérer mes modèles
            </button>
          ) : null}
        </div>

        {customLoading ? (
          <p className="m-0 text-[11px] font-semibold text-slate-400">
            <LoadingLabel spinnerClassName="size-3.5">Chargement…</LoadingLabel>
          </p>
        ) : personalTemplates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center">
            <LayoutTemplate
              className="mx-auto mb-2 h-8 w-8 text-slate-300"
              aria-hidden
            />
            <p className="m-0 text-xs font-bold text-slate-600">
              Aucun modèle personnalisé
            </p>
            <p className="m-0 mt-1 text-[11px] font-semibold text-slate-500">
              Créez votre premier modèle sans quitter la campagne.
            </p>
            {handleCreate ? (
              <button
                type="button"
                onClick={handleCreate}
                className="mt-3 cursor-pointer text-[11px] font-black text-[#2f6fed] underline-offset-2 hover:underline"
              >
                Créer un modèle
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {personalTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={selectedId === template.id}
                onSelect={() => onSelect(template)}
                badge="Perso"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
