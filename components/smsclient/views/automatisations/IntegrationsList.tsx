"use client";

import { IntegrationBrandLogo } from "@/components/smsclient/views/automatisations/IntegrationBrandLogo";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  filterCatalogIntegrations,
  integrationConnectLabel,
  listConnectModalIntegrations,
  type CatalogIntegration,
} from "@/lib/automations/catalog";
import { integrationCategoryLabel } from "@/lib/automations/integrationIcons";
import { cn } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

/** Au-delà de ce nombre de lignes (CRM + custom), la zone liste scroll. */
export const INTEGRATIONS_LIST_SCROLL_THRESHOLD = 8;

export type IntegrationsListProps = {
  onSelect?: (integration: CatalogIntegration) => void;
  onRequestCustom?: () => void;
};

function CustomIntegrationRow({ onRequest }: { onRequest?: () => void }) {
  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-dashed border-violet-300/80 bg-violet-50/40 px-3 py-3",
          "transition-colors hover:border-violet-400/80 hover:bg-violet-50/70",
        )}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-violet-200/80 bg-white text-violet-700 shadow-sm">
          <Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-sm font-black text-foreground">
            Votre outil n&apos;est pas listé ?
          </p>
          <p className="m-0 mt-0.5 text-xs leading-snug text-muted-foreground">
            Décrivez l&apos;intégration souhaitée — nous étudions chaque
            demande.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full border-violet-300/80"
          onClick={() => onRequest?.()}
        >
          Sur demande
        </Button>
      </div>
    </li>
  );
}

export function IntegrationsList({
  onSelect,
  onRequestCustom,
}: IntegrationsListProps) {
  const [query, setQuery] = useState("");
  const all = useMemo(() => listConnectModalIntegrations(), []);
  const filtered = useMemo(
    () => filterCatalogIntegrations(all, query),
    [all, query],
  );

  const scrollable =
    filtered.length + 1 > INTEGRATIONS_LIST_SCROLL_THRESHOLD;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <InputGroup
        className="max-w-xl shrink-0 bg-transparent dark:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0"
        role="search"
      >
        <InputGroupAddon align="inline-start">
          <Search aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un CRM…"
          aria-label="Rechercher un CRM"
        />
      </InputGroup>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]",
          scrollable && "max-h-[min(48vh,22rem)]",
        )}
      >
        {filtered.length === 0 ? (
          <div className="mb-2 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center">
            <p className="m-0 text-sm font-bold text-foreground">
              Aucun CRM trouvé
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Modifie la recherche ou demande un outil personnalisé ci-dessous.
            </p>
          </div>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {filtered.map((item) => {
              const connectLabel = integrationConnectLabel(item.status);
              const available = item.status === "available";
              return (
                <li key={item.id}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 shadow-sm",
                      "transition-colors hover:border-ring/30",
                    )}
                  >
                    <IntegrationBrandLogo
                      integrationId={item.id}
                      category={item.category}
                      label={item.label}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="m-0 text-sm font-black text-foreground">
                          {item.label}
                        </p>
                        <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          {integrationCategoryLabel(item.category)}
                        </span>
                        {!available ? (
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-800">
                            Sur demande
                          </span>
                        ) : null}
                      </div>
                      <p className="m-0 mt-0.5 text-xs leading-snug text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={available ? "default" : "outline"}
                      size="sm"
                      className="shrink-0 rounded-full"
                      onClick={() => onSelect?.(item)}
                    >
                      {connectLabel}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0 pb-0.5">
          <CustomIntegrationRow onRequest={onRequestCustom} />
        </ul>
      </div>
    </div>
  );
}
