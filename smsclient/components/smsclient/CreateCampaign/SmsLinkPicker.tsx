"use client";

import { cn } from "@/lib/cn";
import type { LinkRowData } from "@/lib/types/link";
import { Link2 } from "lucide-react";

type SmsLinkPickerProps = {
  links: LinkRowData[];
  loading?: boolean;
  /** insert : ajoute au clic. select : sélection unique visuelle. */
  mode?: "insert" | "select";
  selectedLinkId?: string | null;
  onSelectLink: (link: LinkRowData) => void;
  disabled?: boolean;
};

export function SmsLinkPicker({
  links,
  loading = false,
  mode = "insert",
  selectedLinkId = null,
  onSelectLink,
  disabled = false,
}: SmsLinkPickerProps) {
  if (loading) {
    return (
      <p className="m-0 text-[11px] font-semibold text-slate-500">
        Chargement des liens…
      </p>
    );
  }

  if (links.length === 0) {
    return (
      <p className="m-0 text-[11px] font-semibold leading-snug text-slate-500">
        Aucun lien enregistré. Créez-en dans{" "}
        <span className="font-black text-slate-700">Outils → Liens</span>.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const title = link.label.trim() || link.shortUrl;
        const isSelected = mode === "select" && selectedLinkId === link.id;
        return (
          <button
            key={link.id}
            type="button"
            title={link.originalUrl}
            disabled={disabled}
            aria-pressed={mode === "select" ? isSelected : undefined}
            onClick={() => onSelectLink(link)}
            className={cn(
              "inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-bold transition-colors",
              isSelected
                ? "border-[#2f6fed] bg-[#eef4ff] text-[#1f3b77] shadow-[inset_0_0_0_1px_rgba(47,111,237,0.12)]"
                : "border-slate-200 bg-white text-slate-800 hover:border-[#2f6fed]/35 hover:bg-[#eef4ff] hover:text-[#1f3b77]",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <Link2 className="h-3.5 w-3.5 shrink-0 text-[#2f6fed]" aria-hidden />
            <span className="truncate">{title}</span>
          </button>
        );
      })}
    </div>
  );
}
