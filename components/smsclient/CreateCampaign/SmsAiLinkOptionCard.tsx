"use client";

import {
  aiOptionCardClass,
  SmsAiOptionHeader,
} from "@/components/smsclient/CreateCampaign/SmsAiOptionChrome";
import { CreateSmsLinkModal } from "@/components/smsclient/modals/CreateSmsLinkModal";
import { LoadingLabel } from "@/components/ui/loading-label";
import { cn } from "@/lib/cn";
import type { LinkRowData } from "@/lib/types/link";
import { useCallback, useState } from "react";

type SmsAiLinkOptionCardProps = {
  links: LinkRowData[];
  loading?: boolean;
  selectedLinkId: string | null;
  onSelectedLinkIdChange: (linkId: string | null) => void;
  onCreateLink?: (args: {
    originalUrl: string;
    label: string;
  }) => Promise<{ data: LinkRowData | null; error: string | null }>;
};

export function SmsAiLinkOptionCard({
  links,
  loading = false,
  selectedLinkId,
  onSelectedLinkIdChange,
  onCreateLink,
}: SmsAiLinkOptionCardProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = Boolean(onCreateLink);

  const handleCreated = useCallback(
    (link: LinkRowData) => {
      onSelectedLinkIdChange(link.id);
    },
    [onSelectedLinkIdChange],
  );

  const toggleLink = (id: string) => {
    onSelectedLinkIdChange(selectedLinkId === id ? null : id);
  };

  const cardActive = selectedLinkId != null;

  return (
    <>
      <div className={aiOptionCardClass(cardActive)}>
        <SmsAiOptionHeader
          emoji="🔗"
          emojiTone={cardActive ? "link" : "neutral"}
          title="Intégrer un lien automatiquement"
        />

        <div className="flex min-h-0 flex-1 flex-wrap content-start gap-1">
          {loading ? (
            <LoadingLabel
              className="text-xs text-muted-foreground"
              spinnerClassName="size-3.5"
            >
              Chargement…
            </LoadingLabel>
          ) : links.length === 0 ? (
            <p className="m-0 text-xs text-muted-foreground">
              Aucun lien enregistré.
            </p>
          ) : (
            links.map((link) => {
              const picked = selectedLinkId === link.id;
              const title = link.label.trim() || link.shortUrl;
              return (
                <button
                  key={link.id}
                  type="button"
                  aria-pressed={picked}
                  onClick={() => toggleLink(link.id)}
                  className={cn(
                    "inline-flex max-w-full shrink-0 cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-left text-xs font-medium transition-colors",
                    picked
                      ? "border-primary/40 bg-background text-foreground shadow-sm"
                      : "border-border bg-muted/40 text-foreground hover:bg-muted/70",
                  )}
                >
                  <span className="leading-none" aria-hidden>
                    🔗
                  </span>
                  <span className="whitespace-nowrap leading-none">{title}</span>
                </button>
              );
            })
          )}

          {canCreate ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-dashed border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:bg-accent/40 hover:text-foreground"
            >
              <span className="leading-none" aria-hidden>
                ➕
              </span>
              <span className="leading-none">Créer un lien</span>
            </button>
          ) : null}
        </div>
      </div>

      {canCreate ? (
        <CreateSmsLinkModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreate={onCreateLink!}
          onCreated={handleCreated}
        />
      ) : null}
    </>
  );
}
