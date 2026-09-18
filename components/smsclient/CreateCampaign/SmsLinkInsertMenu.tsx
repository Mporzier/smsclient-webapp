"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateSmsLinkModal } from "@/components/smsclient/modals/CreateSmsLinkModal";
import { LoadingLabel } from "@/components/ui/loading-label";
import { cn } from "@/lib/cn";
import type { LinkRowData } from "@/lib/types/link";
import { Check, Link2, Plus } from "lucide-react";
import { useCallback, useState } from "react";

type SmsLinkMenuBaseProps = {
  links: LinkRowData[];
  loading?: boolean;
  disabled?: boolean;
  onCreateLink?: (args: {
    originalUrl: string;
    label: string;
  }) => Promise<{ data: LinkRowData | null; error: string | null }>;
  contentClassName?: string;
  /** Bouton « Nouveau lien » à côté du menu (Options IA). */
  showExternalCreateButton?: boolean;
  externalCreateLabel?: string;
};

type SmsLinkInsertMenuProps = SmsLinkMenuBaseProps & {
  mode?: "insert";
  onInsert: (link: LinkRowData) => void;
};

type SmsLinkPickMenuProps = SmsLinkMenuBaseProps & {
  mode: "pick";
  selectedLinkId?: string | null;
  onPick: (link: LinkRowData | null) => void;
};

export function SmsLinkInsertMenu(
  props: SmsLinkInsertMenuProps | SmsLinkPickMenuProps,
) {
  const {
    links,
    loading = false,
    disabled = false,
    onCreateLink,
    contentClassName,
    showExternalCreateButton = false,
    externalCreateLabel = "Nouveau lien",
  } = props;
  const isPickMode = props.mode === "pick";
  const mode = isPickMode ? "pick" : "insert";
  const onInsert = isPickMode ? undefined : props.onInsert;
  const onPick = isPickMode ? props.onPick : undefined;
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = Boolean(onCreateLink);

  const applyLink = useCallback(
    (link: LinkRowData) => {
      if (mode === "pick") onPick?.(link);
      else onInsert?.(link);
    },
    [mode, onInsert, onPick],
  );

  const handleCreated = useCallback(
    (link: LinkRowData) => {
      applyLink(link);
    },
    [applyLink],
  );

  const triggerLabel =
    mode === "pick" ? "Choisir un lien" : "Insérer un lien";
  const menuHint =
    mode === "pick"
      ? "L’IA intègre l’URL courte du lien dans le SMS généré."
      : "Insère l'URL courte du lien dans le message.";

  const selectedLinkId = isPickMode ? props.selectedLinkId : null;

  return (
    <>
      <div
        className={cn(showExternalCreateButton && "flex flex-wrap items-center gap-2")}
      >
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || loading}
              className="h-8 gap-1.5 rounded-lg px-2.5 text-[11px] font-bold"
            >
              <Link2 className="size-3.5" aria-hidden />
              {triggerLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className={cn("w-72", contentClassName)}
          >
            <DropdownMenuLabel>{menuHint}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {loading ? (
              <DropdownMenuLabel className="font-normal">
                <LoadingLabel spinnerClassName="size-3.5">
                  Chargement des liens…
                </LoadingLabel>
              </DropdownMenuLabel>
            ) : (
              <>
                {mode === "pick" ? (
                  <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={() => onPick?.(null)}>
                      {!selectedLinkId ? (
                        <Check className="size-3.5" aria-hidden />
                      ) : (
                        <span className="size-3.5" aria-hidden />
                      )}
                      Aucun lien
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                ) : null}
                {links.length === 0 ? (
                  <DropdownMenuLabel className="font-normal">
                    Aucun lien enregistré.
                  </DropdownMenuLabel>
                ) : (
                  <DropdownMenuGroup>
                    {links.map((link) => {
                      const title = link.label.trim() || link.shortUrl;
                      const picked =
                        mode === "pick" && selectedLinkId === link.id;
                      return (
                        <DropdownMenuItem
                          key={link.id}
                          className="flex flex-col items-start gap-0.5"
                          onSelect={() => applyLink(link)}
                        >
                          <span className="flex w-full items-center gap-2">
                            {mode === "pick" ? (
                              picked ? (
                                <Check className="size-3.5 shrink-0" aria-hidden />
                              ) : (
                                <span className="size-3.5 shrink-0" aria-hidden />
                              )
                            ) : null}
                            <span className="min-w-0 truncate font-medium leading-none">
                              {title}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "w-full truncate text-xs text-muted-foreground",
                              mode === "pick" && "pl-5",
                            )}
                          >
                            {link.shortUrl}
                          </span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuGroup>
                )}
              </>
            )}
            {canCreate && !showExternalCreateButton ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => setCreateOpen(true)}>
                    <Plus className="size-3.5" aria-hidden />
                    Créer un lien
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        {showExternalCreateButton && canCreate ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || loading}
            className="h-8 gap-1.5 rounded-lg px-2.5 text-[11px] font-bold"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-3.5" aria-hidden />
            {externalCreateLabel}
          </Button>
        ) : null}
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
