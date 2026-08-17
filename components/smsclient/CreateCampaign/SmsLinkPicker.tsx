"use client";

import { cn } from "@/lib/cn";
import { CreateSmsLinkModal } from "@/components/smsclient/modals/CreateSmsLinkModal";
import { LoadingLabel } from "@/components/ui/loading-label";
import type { LinkRowData } from "@/lib/types/link";
import { Link2, Plus } from "lucide-react";
import { useCallback, useState } from "react";

type SmsLinkPickerProps = {
  links: LinkRowData[];
  loading?: boolean;
  /** insert : ajoute au clic. select : sélection unique visuelle. */
  mode?: "insert" | "select";
  selectedLinkId?: string | null;
  onSelectLink: (link: LinkRowData) => void;
  disabled?: boolean;
  onCreateLink?: (args: {
    originalUrl: string;
    label: string;
  }) => Promise<{ data: LinkRowData | null; error: string | null }>;
  onLinkCreated?: (link: LinkRowData) => void;
};

function AddLinkButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1 rounded-lg border border-dashed border-[#2f6fed]/35 bg-[#eef4ff]/40 px-2.5 py-1.5 text-[11px] font-bold text-[#2f6fed] transition-colors hover:border-[#2f6fed]/55 hover:bg-[#eef4ff]",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Lien
    </button>
  );
}

export function SmsLinkPicker({
  links,
  loading = false,
  mode = "insert",
  selectedLinkId = null,
  onSelectLink,
  disabled = false,
  onCreateLink,
  onLinkCreated,
}: SmsLinkPickerProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = Boolean(onCreateLink);

  const handleLinkCreated = useCallback(
    (link: LinkRowData) => {
      onLinkCreated?.(link);
      onSelectLink(link);
    },
    [onLinkCreated, onSelectLink]
  );

  if (loading) {
    return (
      <p className="m-0 text-[11px] font-semibold text-slate-500">
        <LoadingLabel spinnerClassName="size-3.5">
          Chargement des liens…
        </LoadingLabel>
      </p>
    );
  }

  if (links.length === 0) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <p className="m-0 text-[11px] font-semibold leading-snug text-slate-500">
            Aucun lien enregistré.
          </p>
          {canCreate ? (
            <AddLinkButton
              disabled={disabled}
              onClick={() => setCreateOpen(true)}
            />
          ) : null}
        </div>
        {canCreate ? (
          <CreateSmsLinkModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreate={onCreateLink!}
            onCreated={handleLinkCreated}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <div className="min-w-0 overflow-x-hidden">
        <div className="flex flex-wrap gap-2">
          {links.map((link) => {
            const title = link.label.trim() || link.shortUrl;
            const isSelected = mode === "select" && selectedLinkId === link.id;
            return (
              <button
                key={link.id}
                type="button"
                disabled={disabled}
                aria-pressed={mode === "select" ? isSelected : undefined}
                onClick={() => onSelectLink(link)}
                className={cn(
                  "inline-flex min-w-0 max-w-full cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-bold transition-colors",
                  "max-w-[min(100%,16rem)]",
                  isSelected
                    ? "border-[#2f6fed] bg-[#eef4ff] text-[#1f3b77] shadow-[inset_0_0_0_1px_rgba(47,111,237,0.12)]"
                    : "border-slate-200 bg-white text-slate-800 hover:border-[#2f6fed]/35 hover:bg-[#eef4ff] hover:text-[#1f3b77]",
                  disabled && "pointer-events-none opacity-50",
                )}
              >
                <Link2
                  className="h-3.5 w-3.5 shrink-0 text-[#2f6fed]"
                  aria-hidden
                />
                <span className="min-w-0 truncate">{title}</span>
              </button>
            );
          })}
          {canCreate ? (
            <AddLinkButton
              disabled={disabled}
              onClick={() => setCreateOpen(true)}
            />
          ) : null}
        </div>
      </div>
      {canCreate ? (
        <CreateSmsLinkModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreate={onCreateLink!}
          onCreated={handleLinkCreated}
        />
      ) : null}
    </>
  );
}
