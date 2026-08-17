"use client";

import { brandBtnCls } from "@/components/smsclient/modals/modalChrome";
import { SelectAllExpandBanner } from "@/components/smsclient/SelectAllExpandBanner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingLabel } from "@/components/ui/loading-label";
import { fieldBox } from "@/components/smsclient/flowFieldStyles";
import { cn } from "@/lib/cn";
import { SEARCH_QUERY_MAX_LENGTH } from "@/lib/forms/fieldLimits";
import {
  avatarColor,
  contactInitials,
  groupColor,
  groupTagBase,
} from "@/lib/proto/contactDisplay";
import { Users, Search, Contact, FolderOpen, ChevronRight } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  contactDisplayName,
  groupChipBase,
  RecipientListSkeleton,
  SummaryStatBubble,
} from "./step1/step1Helpers";
import {
  useCampaignWizardStep1State,
  type CampaignWizardStep1Props,
  type Step1ContextValue,
} from "./step1/useCampaignWizardStep1State";

export type { CampaignWizardStep1Props } from "./step1/useCampaignWizardStep1State";

const Step1Context = createContext<Step1ContextValue | null>(null);

function useStep1Context() {
  const ctx = useContext(Step1Context);
  if (!ctx) {
    throw new Error(
      "CampaignWizardStep1 components must be used within CampaignWizardStep1Provider"
    );
  }
  return ctx;
}

export function useCampaignWizardStep1() {
  return useStep1Context();
}

export function CampaignWizardStep1ContinueButton({
  className,
  onContinue,
}: {
  className?: string;
  onContinue: (ready: {
    contactIds: string[];
    groupNames: string[];
  }) => void;
}) {
  const { ensureSelectionReady } = useStep1Context();
  return (
    <Button
      variant="default"
      size="lg"
      className={className}
      onClick={() => {
        void (async () => {
          const ready = await ensureSelectionReady();
          onContinue(ready);
        })();
      }}
    >
      Continuer
      <ChevronRight className="h-4 w-4" />
    </Button>
  );
}

export function CampaignWizardStep1Provider({
  children,
  ...props
}: CampaignWizardStep1Props & { children: ReactNode }) {
  const value = useCampaignWizardStep1State(props);
  return (
    <Step1Context.Provider value={value}>{children}</Step1Context.Provider>
  );
}

export function CampaignWizardStep1Main() {
  const {
    tab,
    setTab,
    search,
    setSearch,
    groupsLoading,
    contactsLoading,
    recipientExcludedStop,
    recipientExcludedInvalid,
    filteredContacts,
    filteredGroups,
    isContactChecked,
    toggleContact,
    toggleGroup,
    canSelectAll,
    canClearSelection,
    handleSelectAll,
    handleClearSelection,
    recipientMode,
    selectedGroupNames,
    listHasMore,
    listLoadingMore,
    onListLoadMore,
    listRowCount,
    expandBanner,
  } = useStep1Context();

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onListLoadMoreRef = useRef(onListLoadMore);

  useEffect(() => {
    onListLoadMoreRef.current = onListLoadMore;
  });

  useEffect(() => {
    const listLoading = tab === "manual" ? contactsLoading : groupsLoading;
    if (!onListLoadMore || !listHasMore || listLoading || listLoadingMore) {
      return;
    }
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;

    const maybeLoad = () => {
      const rootRect = root.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      if (targetRect.top <= rootRect.bottom + 120) {
        onListLoadMoreRef.current?.();
      }
    };

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onListLoadMoreRef.current?.();
        }
      },
      { root, rootMargin: "120px", threshold: 0 },
    );
    obs.observe(target);
    maybeLoad();
    return () => obs.disconnect();
  }, [
    onListLoadMore,
    listHasMore,
    listRowCount,
    contactsLoading,
    groupsLoading,
    listLoadingMore,
    tab,
  ]);

  return (
    <div
      className={cn(
        fieldBox,
        "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden py-3 shadow-none"
      )}
    >
      <div className="shrink-0">
        <h2 className="m-0 text-sm font-black leading-snug text-foreground">
          À qui voulez-vous envoyer votre SMS ?
        </h2>
      </div>

      <div
        className="flex shrink-0 gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5"
        role="tablist"
        aria-label="Mode de sélection des destinataires"
      >
        {[
          ["manual", "Sélection manuelle", Contact] as const,
          ["groups", "Groupes", FolderOpen] as const,
        ].map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-extrabold transition-colors",
              tab === id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div
          className="flex h-9 min-w-0 max-w-md flex-1 items-center gap-2 rounded-xl border border-border bg-card px-2.5"
          role="search"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <input
            className="min-w-0 flex-1 border-none bg-transparent text-xs font-semibold text-foreground outline-none placeholder:text-muted-foreground"
            placeholder={
              tab === "manual"
                ? "Rechercher un contact par nom, téléphone ou groupe"
                : "Rechercher un groupe"
            }
            value={search}
            maxLength={SEARCH_QUERY_MAX_LENGTH}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={
              tab === "manual"
                ? "Rechercher un contact"
                : "Rechercher un groupe"
            }
          />
        </div>
        {expandBanner.show ? (
          <SelectAllExpandBanner
            matchTotal={expandBanner.matchTotal}
            hasSearch={expandBanner.hasSearch}
            entityLabel={expandBanner.entityLabel}
            counting={expandBanner.counting}
            expanding={expandBanner.expanding}
            error={expandBanner.expandError}
            onExpand={expandBanner.onExpand}
          />
        ) : null}
        <Button
          variant="outline"
          size="lg"
          className={cn(brandBtnCls, "h-8 shrink-0 px-2.5 text-[11px]")}
          onClick={handleSelectAll}
          disabled={!canSelectAll}
        >
          Tout sélectionner
        </Button>
        <Button
          variant="outline"
          size="lg"
          className={cn(brandBtnCls, "h-8 shrink-0 px-2.5 text-[11px]")}
          onClick={handleClearSelection}
          disabled={!canClearSelection}
        >
          Tout désélectionner
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto rounded-xl border border-border"
      >
        {tab === "manual" ? (
          contactsLoading ? (
            <RecipientListSkeleton />
          ) : filteredContacts.length === 0 ? (
            <p className="m-0 px-3 py-8 text-center text-sm font-semibold text-muted-foreground">
              {search.trim()
                ? "Aucun contact trouvé."
                : "Aucun contact."}
            </p>
          ) : (
            <>
              {filteredContacts.map((c) => {
              const isUnsubscribed = c.stopSms || !c.optIn;
              const checked = isContactChecked(c);
              const av = avatarColor(c.id);
              const initials = contactInitials(c);
              return (
                <label
                  key={c.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 border-b border-border/50 px-3 py-1.5 last:border-b-0",
                    isUnsubscribed
                      ? "cursor-not-allowed bg-muted/50 opacity-70"
                      : checked
                      ? "bg-accent/80"
                      : "bg-card hover:bg-muted/50"
                  )}
                >
                  <Checkbox
                    checked={checked}
                    disabled={isUnsubscribed || recipientMode === "all"}
                    onCheckedChange={() => toggleContact(c.id)}
                    className="shrink-0"
                  />
                  <div
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-medium",
                      av.bg,
                      av.text
                    )}
                  >
                    {initials}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm font-normal",
                        isUnsubscribed ? "text-muted-foreground" : "text-foreground"
                      )}
                    >
                      {contactDisplayName(c)}
                    </span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">
                      {c.phone}
                      {isUnsubscribed ? (
                        <>
                          {" · "}
                          <span className="font-medium text-rose-600">
                            désabonné
                          </span>
                        </>
                      ) : null}
                    </span>
                  </span>
                  <div className="hidden min-w-0 max-w-[48%] shrink-0 flex-wrap justify-end gap-1 sm:flex">
                    {c.groups.length === 0 ? (
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        Non classé
                      </span>
                    ) : (
                      c.groups.slice(0, 4).map((g) => {
                        const gc = groupColor(g);
                        return (
                          <span
                            key={g}
                            className={cn(
                              groupChipBase,
                              gc.bg,
                              gc.border,
                              gc.text
                            )}
                          >
                            {g}
                          </span>
                        );
                      })
                    )}
                    {c.groups.length > 4 && (
                      <span className="text-[11px] font-bold text-muted-foreground">
                        +{c.groups.length - 4}
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
              {onListLoadMore && listHasMore ? (
                <div
                  ref={sentinelRef}
                  className="flex h-10 items-center justify-center text-xs text-muted-foreground"
                  aria-hidden
                >
                  {listLoadingMore ? (
                    <LoadingLabel className="text-xs" spinnerClassName="size-3.5">
                      Chargement…
                    </LoadingLabel>
                  ) : null}
                </div>
              ) : null}
            </>
          )
        ) : groupsLoading ? (
          <RecipientListSkeleton />
        ) : filteredGroups.length === 0 ? (
          <p className="m-0 px-3 py-8 text-center text-sm font-semibold text-muted-foreground">
            {search.trim()
              ? "Aucun groupe trouvé."
              : "Aucun groupe créé."}
          </p>
        ) : (
          <>
            {filteredGroups.map((g) => {
            const checked = selectedGroupNames.includes(g.name);
            const gc = groupColor(g.name);
            return (
              <label
                key={g.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 border-b border-border/50 px-3 py-1.5 last:border-b-0",
                  checked ? "bg-accent/80" : "bg-card hover:bg-muted/50"
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleGroup(g.name)}
                  className="shrink-0"
                />
                <div
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-medium",
                    gc.bg,
                    gc.border,
                    gc.text
                  )}
                >
                  <Users className="h-3.5 w-3.5" aria-hidden />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-normal text-foreground">
                    {g.name}
                  </span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {g.contactCount} contact
                    {g.contactCount !== 1 ? "s" : ""}
                    {g.description.trim() ? ` · ${g.description.trim()}` : ""}
                  </span>
                </span>
              </label>
            );
          })}
            {onListLoadMore && listHasMore ? (
              <div
                ref={sentinelRef}
                className="flex h-10 items-center justify-center text-xs text-muted-foreground"
                aria-hidden
              >
                {listLoadingMore ? (
                  <LoadingLabel className="text-xs" spinnerClassName="size-3.5">
                    Chargement…
                  </LoadingLabel>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>

      {(recipientExcludedStop > 0 || recipientExcludedInvalid > 0) && (
        <p className="shrink-0 text-[11px] font-semibold text-muted-foreground">
          {recipientExcludedStop > 0 &&
            `${recipientExcludedStop} exclus (STOP)`}
          {recipientExcludedStop > 0 && recipientExcludedInvalid > 0
            ? " · "
            : ""}
          {recipientExcludedInvalid > 0 &&
            `${recipientExcludedInvalid} non éligibles`}
        </p>
      )}
    </div>
  );
}

export function CampaignWizardStep1Summary() {
  const {
    recipients,
    recipientMode,
    contactsSelectedCount,
    groupsSelectedCount,
    selectedGroupsDisplay,
    excludedTotal,
    recipientsResolving,
  } = useStep1Context();

  return (
    <aside
      className={cn(
        fieldBox,
        "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden py-3 shadow-none"
      )}
    >
      <h3 className="m-0 shrink-0 text-xs font-black text-foreground">Résumé</h3>

      <SummaryStatBubble
        label="Contacts sélectionnés"
        value={contactsSelectedCount}
      />

      <SummaryStatBubble
        label="Groupes sélectionnés"
        value={groupsSelectedCount}
      >
        {selectedGroupsDisplay.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedGroupsDisplay.map(({ name, contactCount }) => {
              const gc = groupColor(name);
              return (
                <span
                  key={name}
                  className={cn(
                    groupTagBase,
                    gc.bg,
                    gc.border,
                    gc.text,
                    "inline-flex max-w-full items-center gap-1 py-0.5 text-[10px] font-bold"
                  )}
                >
                  <span className="truncate">{name}</span>
                  <span className="font-semibold opacity-80">
                    · {contactCount}
                  </span>
                </span>
              );
            })}
          </div>
        ) : (
          <p className="m-0 mt-1.5 text-[11px] font-semibold text-muted-foreground">
            Aucun groupe sélectionné
          </p>
        )}
      </SummaryStatBubble>

      <SummaryStatBubble label="Exclus (non éligibles)" value={excludedTotal} />

      {recipientMode === "all" && (
        <p className="m-0 shrink-0 text-[11px] font-semibold text-foreground">
          Tous vos contacts éligibles sont inclus.
        </p>
      )}

      {recipientsResolving ? (
        <p className="m-0 shrink-0 text-[11px] font-semibold text-muted-foreground">
          Calcul des destinataires…
        </p>
      ) : null}

      <div className="mt-auto shrink-0 pt-1">
        <SummaryStatBubble
          label="Destinataires finaux"
          value={recipients}
          highlight
        />
      </div>
    </aside>
  );
}
