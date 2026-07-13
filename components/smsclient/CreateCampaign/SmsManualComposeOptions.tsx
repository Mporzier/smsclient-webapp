"use client";

import { SmsLinkPicker } from "@/components/smsclient/CreateCampaign/SmsLinkPicker";
import { brandBtnPrimaryCls } from "@/components/smsclient/modals/modalChrome";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { LinkRowData } from "@/lib/types/link";
import { Link2, Wand2 } from "lucide-react";

type SmsManualComposeOptionsProps = {
  onCorrectAndReformulate: () => void;
  savedLinks: LinkRowData[];
  linksLoading?: boolean;
  onSelectLink: (link: LinkRowData) => void;
  onCreateLink?: (args: {
    originalUrl: string;
    label: string;
  }) => Promise<{ data: LinkRowData | null; error: string | null }>;
  disabled?: boolean;
};

export function SmsManualComposeOptions({
  onCorrectAndReformulate,
  savedLinks,
  linksLoading = false,
  onSelectLink,
  onCreateLink,
  disabled = false,
}: SmsManualComposeOptionsProps) {
  return (
    <div className="shrink-0 border-t border-slate-100 pt-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Wand2 className="h-3.5 w-3.5 text-[#2f6fed]" aria-hidden />
        <span className="text-xs font-black text-slate-900">
          Aide à la rédaction
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="default"
          size="lg"
          className={cn(brandBtnPrimaryCls, "h-10 w-full gap-2 text-sm")}
          onClick={onCorrectAndReformulate}
          disabled={disabled}
        >
          <Wand2 className="h-4 w-4" aria-hidden />
          Correction et reformulation
        </Button>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-start gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
              <Link2 className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-xs font-black leading-snug text-slate-900">
                Ajouter un lien
              </p>
              <p className="m-0 mt-1 text-[11px] font-semibold leading-snug text-slate-500">
                Cliquez sur un lien pour l&apos;insérer dans votre SMS.
              </p>
            </div>
          </div>

          <div className="mt-3 min-w-0 overflow-x-hidden rounded-xl border border-[#dfe6f2] bg-slate-50/80 p-2.5">
            <SmsLinkPicker
              links={savedLinks}
              loading={linksLoading}
              onSelectLink={onSelectLink}
              disabled={disabled}
              onCreateLink={onCreateLink}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
