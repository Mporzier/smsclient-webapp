"use client";

import { ProtoBtn } from "@/components/smsclient/ui";
import { fieldBox } from "@/components/smsclient/flowFieldStyles";
import { cn } from "@/lib/cn";
import {
  avatarColor,
  contactInitials,
  groupColor,
  groupTagBase,
} from "@/lib/proto/contactDisplay";
import { buildCampaignRecipientIdSet } from "@/lib/proto/smsPersonalization";
import { formatInt } from "@/lib/proto/smsUtils";
import { formatContactGroups, type ContactRowData } from "@/lib/types/contact";
import type { GroupRowData } from "@/lib/types/group";
import { Users, Search, Contact, FolderOpen } from "lucide-react";
import {
  useCallback,
  useMemo,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

function frPhoneSearchKey(s: string): string {
  let d = digitsOnly(s);
  if (d.startsWith("33")) {
    const rest = d.slice(2);
    if (rest.length > 0) d = `0${rest}`;
  } else if (d.length === 9 && /^[67]/.test(d)) {
    d = `0${d}`;
  }
  return d;
}

function contactMatchesSearch(c: ContactRowData, rawQuery: string): boolean {
  const qTrim = rawQuery.trim();
  if (!qTrim) return true;

  const qLower = qTrim.toLowerCase();
  const groupsText = formatContactGroups(c.groups).toLowerCase();
  const nameHay = [c.name, c.firstName, c.lastName]
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  const textHay = `${nameHay} ${c.phone.toLowerCase()} ${groupsText}`;

  if (textHay.includes(qLower)) return true;

  const terms = qLower.split(/\s+/).filter(Boolean);
  if (terms.length > 1 && terms.every((t) => textHay.includes(t))) {
    return true;
  }

  const qDigits = digitsOnly(qTrim);
  const qPhoneKey = frPhoneSearchKey(qTrim);
  const phoneKey = frPhoneSearchKey(c.phone);
  if (
    qDigits.length >= 2 &&
    phoneKey.length > 0 &&
    phoneKey.includes(qPhoneKey)
  ) {
    return true;
  }

  return false;
}

function groupMatchesSearch(g: GroupRowData, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  return (
    g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
  );
}

function normalizeGroupName(name: string): string {
  return name.trim().toLowerCase();
}

function contactBelongsToGroup(c: ContactRowData, groupName: string): boolean {
  const wanted = normalizeGroupName(groupName);
  return c.groups.some((g) => normalizeGroupName(g) === wanted);
}

function selectedGroupsForContact(
  contact: ContactRowData,
  selectedGroupNames: string[]
): string[] {
  return selectedGroupNames.filter((gName) =>
    contactBelongsToGroup(contact, gName)
  );
}

const groupChipBase = cn(
  groupTagBase,
  "max-w-[7rem] truncate py-0.5 text-[10px] font-bold"
);

function SummaryStatBubble({
  label,
  value,
  highlight,
  children,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5",
        highlight
          ? "border-[#2f6fed]/30 bg-[#eef4ff]"
          : "border-slate-200 bg-slate-50"
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "text-xs font-extrabold",
            highlight ? "text-[#1f3b77]" : "text-slate-700"
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "text-lg font-black tabular-nums",
            highlight ? "text-[#1f3b77]" : "text-slate-900"
          )}
        >
          {formatInt(value)}
        </span>
      </div>
      {children}
    </div>
  );
}

type RecipientTab = "manual" | "groups";

function RecipientListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-3 px-3 py-2.5"
        >
          <div className="h-4 w-4 shrink-0 rounded bg-slate-200" />
          <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-2/5 max-w-[140px] rounded bg-slate-200" />
            <div className="h-3 w-3/5 max-w-[200px] rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export type CampaignWizardStep1Props = {
  groups: GroupRowData[];
  groupsLoading: boolean;
  contacts: ContactRowData[];
  contactsLoading: boolean;
  recipientMode: "manual" | "lists" | "all" | "numbers";
  setRecipientMode: (v: "manual" | "lists" | "all" | "numbers") => void;
  selectedGroupNames: string[];
  setSelectedGroupNames: React.Dispatch<React.SetStateAction<string[]>>;
  selectedContactIds: string[];
  setSelectedContactIds: React.Dispatch<React.SetStateAction<string[]>>;
  excludedContactIds: string[];
  setExcludedContactIds: React.Dispatch<React.SetStateAction<string[]>>;
  recipientExcludedStop: number;
  recipientExcludedInvalid: number;
  recipientCount: number;
};

function contactDisplayName(c: ContactRowData): string {
  const first = c.firstName.trim();
  const last = c.lastName.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return c.name.trim() || "—";
}

function useCampaignWizardStep1State({
  groups,
  groupsLoading,
  contacts,
  contactsLoading,
  recipientMode,
  setRecipientMode,
  selectedGroupNames,
  setSelectedGroupNames,
  selectedContactIds,
  setSelectedContactIds,
  excludedContactIds,
  setExcludedContactIds,
  recipientExcludedStop,
  recipientExcludedInvalid,
  recipientCount,
}: CampaignWizardStep1Props) {
  const [tab, setTab] = useState<RecipientTab>("manual");
  const [search, setSearch] = useState("");

  const recipients = Math.max(0, recipientCount);

  const selectedIdsFromGroups = useMemo(() => {
    if (selectedGroupNames.length === 0) return new Set<string>();
    const wanted = selectedGroupNames.map((x) => x.trim().toLowerCase());
    const ids = new Set<string>();
    for (const c of contacts) {
      if (c.groups.some((g) => wanted.includes(g.trim().toLowerCase()))) {
        ids.add(c.id);
      }
    }
    return ids;
  }, [contacts, selectedGroupNames]);

  const filteredContacts = useMemo(() => {
    const base = !search.trim()
      ? contacts
      : contacts.filter((c) => contactMatchesSearch(c, search));

    const subscribed: typeof base = [];
    const unsubscribed: typeof base = [];
    for (const c of base) {
      if (c.stopSms || !c.optIn) unsubscribed.push(c);
      else subscribed.push(c);
    }
    return [...subscribed, ...unsubscribed];
  }, [contacts, search]);

  const filteredGroups = useMemo(
    () =>
      !search.trim()
        ? groups
        : groups.filter((g) => groupMatchesSearch(g, search)),
    [groups, search]
  );

  const selectableFilteredContacts = useMemo(
    () => filteredContacts.filter((c) => !c.stopSms && c.optIn),
    [filteredContacts]
  );

  const effectiveSelectedIds = useMemo(
    () =>
      buildCampaignRecipientIdSet({
        contacts,
        recipientMode,
        selectedContactIds,
        selectedGroupNames,
        excludedContactIds,
      }),
    [
      contacts,
      recipientMode,
      selectedContactIds,
      selectedGroupNames,
      excludedContactIds,
    ]
  );

  const isContactChecked = useCallback(
    (c: ContactRowData) => {
      if (c.stopSms || !c.optIn) return false;
      if (recipientMode === "all") return true;
      return effectiveSelectedIds.has(c.id);
    },
    [recipientMode, effectiveSelectedIds]
  );

  const contactsSelectedCount = useMemo(() => {
    if (recipientMode === "all") {
      return contacts.filter((c) => c.optIn && !c.stopSms).length;
    }
    let count = 0;
    for (const c of contacts) {
      if (c.optIn && !c.stopSms && effectiveSelectedIds.has(c.id)) count++;
    }
    return count;
  }, [recipientMode, contacts, effectiveSelectedIds]);

  const selectedGroupsDisplay = useMemo(
    () =>
      selectedGroupNames.map((name) => {
        const row = groups.find(
          (g) => g.name.trim().toLowerCase() === name.trim().toLowerCase()
        );
        return { name, contactCount: row?.contactCount ?? 0 };
      }),
    [selectedGroupNames, groups]
  );

  const excludedTotal = recipientExcludedStop + recipientExcludedInvalid;

  const toggleContact = useCallback(
    (id: string) => {
      if (recipientMode === "all") {
        const allEligible = contacts
          .filter((c) => c.optIn && !c.stopSms)
          .map((c) => c.id);
        setRecipientMode("manual");
        setSelectedGroupNames([]);
        setExcludedContactIds([]);
        setSelectedContactIds(allEligible.filter((x) => x !== id));
        return;
      }

      const inGroup =
        recipientMode === "lists" && selectedIdsFromGroups.has(id);
      const checked = effectiveSelectedIds.has(id);

      if (checked) {
        if (inGroup) {
          const contact = contacts.find((c) => c.id === id);
          const affectedGroups = contact
            ? selectedGroupsForContact(contact, selectedGroupNames)
            : [];
          const affectedSet = new Set(
            affectedGroups.map((g) => normalizeGroupName(g))
          );
          const nextGroupNames = selectedGroupNames.filter(
            (g) => !affectedSet.has(normalizeGroupName(g))
          );

          setSelectedGroupNames(nextGroupNames);
          setSelectedContactIds((prev) => {
            const next = new Set(prev);
            for (const gName of affectedGroups) {
              for (const c of contacts) {
                if (
                  c.id !== id &&
                  contactBelongsToGroup(c, gName) &&
                  !excludedContactIds.includes(c.id)
                ) {
                  next.add(c.id);
                }
              }
            }
            next.delete(id);
            return Array.from(next);
          });
          setExcludedContactIds((prev) =>
            prev.filter(
              (excludedId) =>
                !contacts.some(
                  (c) =>
                    c.id === excludedId &&
                    c.groups.some((g) => affectedSet.has(normalizeGroupName(g)))
                )
            )
          );
          setRecipientMode(nextGroupNames.length > 0 ? "lists" : "manual");
          return;
        }
        setSelectedContactIds((prev) => prev.filter((x) => x !== id));
      } else {
        setExcludedContactIds((prev) => prev.filter((x) => x !== id));
        if (!inGroup) {
          setSelectedContactIds((prev) =>
            prev.includes(id) ? prev : [...prev, id]
          );
        }
      }
      setRecipientMode(selectedGroupNames.length > 0 ? "lists" : "manual");
    },
    [
      recipientMode,
      contacts,
      selectedGroupNames,
      selectedGroupNames.length,
      selectedIdsFromGroups,
      effectiveSelectedIds,
      excludedContactIds,
      setRecipientMode,
      setSelectedContactIds,
      setSelectedGroupNames,
      setExcludedContactIds,
    ]
  );

  const toggleGroup = useCallback(
    (groupName: string) => {
      const isAdding = !selectedGroupNames.includes(groupName);
      const nextGroups = isAdding
        ? [...selectedGroupNames, groupName]
        : selectedGroupNames.filter((x) => x !== groupName);
      setSelectedGroupNames(nextGroups);

      if (isAdding) {
        const wanted = groupName.trim().toLowerCase();
        const memberIds = contacts
          .filter((c) =>
            c.groups.some((g) => g.trim().toLowerCase() === wanted)
          )
          .map((c) => c.id);
        setExcludedContactIds((prev) =>
          prev.filter((id) => !memberIds.includes(id))
        );
      }

      setRecipientMode(
        nextGroups.length > 0
          ? "lists"
          : selectedContactIds.length > 0
          ? "manual"
          : "manual"
      );
    },
    [
      contacts,
      selectedGroupNames,
      selectedContactIds.length,
      setSelectedGroupNames,
      setExcludedContactIds,
      setRecipientMode,
    ]
  );

  const selectAllVisibleContacts = useCallback(() => {
    const visibleIds = selectableFilteredContacts.map((c) => c.id);
    setExcludedContactIds((prev) =>
      prev.filter((id) => !visibleIds.includes(id))
    );
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) next.add(id);
      return Array.from(next);
    });
    setRecipientMode(selectedGroupNames.length > 0 ? "lists" : "manual");
  }, [
    selectableFilteredContacts,
    selectedGroupNames.length,
    setExcludedContactIds,
    setSelectedContactIds,
    setRecipientMode,
  ]);

  const selectAllVisibleGroups = useCallback(() => {
    setSelectedGroupNames((prev) => {
      const next = new Set(prev);
      for (const g of filteredGroups) next.add(g.name);
      return Array.from(next);
    });
    setRecipientMode("lists");
  }, [filteredGroups, setSelectedGroupNames, setRecipientMode]);

  const clearManualSelection = useCallback(() => {
    setSelectedContactIds([]);
    if (recipientMode === "all") {
      setRecipientMode(selectedGroupNames.length > 0 ? "lists" : "manual");
      return;
    }
    setRecipientMode(selectedGroupNames.length > 0 ? "lists" : "manual");
  }, [
    recipientMode,
    selectedGroupNames.length,
    setSelectedContactIds,
    setRecipientMode,
  ]);

  const clearGroupSelection = useCallback(() => {
    setSelectedGroupNames([]);
    setRecipientMode(selectedContactIds.length > 0 ? "manual" : "manual");
  }, [selectedContactIds.length, setSelectedGroupNames, setRecipientMode]);

  const canSelectAll =
    tab === "manual"
      ? selectableFilteredContacts.length > 0 && recipientMode !== "all"
      : filteredGroups.length > 0;

  const canClearSelection =
    tab === "manual"
      ? recipientMode === "all" || selectedContactIds.length > 0
      : selectedGroupNames.length > 0;

  const handleSelectAll = () => {
    if (tab === "manual") selectAllVisibleContacts();
    else selectAllVisibleGroups();
  };

  const handleClearSelection = () => {
    if (tab === "manual") clearManualSelection();
    else clearGroupSelection();
  };

  return {
    tab,
    setTab,
    search,
    setSearch,
    groups,
    groupsLoading,
    contactsLoading,
    recipients,
    recipientMode,
    recipientExcludedStop,
    recipientExcludedInvalid,
    selectedGroupNames,
    selectedContactIds,
    selectedIdsFromGroups,
    filteredContacts,
    filteredGroups,
    isContactChecked,
    toggleContact,
    toggleGroup,
    canSelectAll,
    canClearSelection,
    handleSelectAll,
    handleClearSelection,
    contactsSelectedCount,
    selectedGroupsDisplay,
    excludedTotal,
  };
}

type Step1ContextValue = ReturnType<typeof useCampaignWizardStep1State>;

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
    groups,
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
  } = useStep1Context();

  return (
    <div
      className={cn(
        fieldBox,
        "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden py-3"
      )}
    >
      <div className="shrink-0">
        <h2 className="m-0 text-sm font-black leading-snug text-slate-900">
          À qui voulez-vous envoyer votre SMS ?
        </h2>
      </div>

      <div
        className="flex shrink-0 gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
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
            onClick={() => {
              setTab(id);
              setSearch("");
            }}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-extrabold transition-colors",
              tab === id
                ? "bg-white text-[#1f3b77] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div
          className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5"
          role="search"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          <input
            className="min-w-0 flex-1 border-none bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            placeholder={
              tab === "manual"
                ? "Rechercher un contact par nom, téléphone ou groupe"
                : "Rechercher un groupe"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={
              tab === "manual"
                ? "Rechercher un contact"
                : "Rechercher un groupe"
            }
          />
        </div>
        <ProtoBtn
          className="h-8 shrink-0 px-2.5 text-[11px]"
          onClick={handleSelectAll}
          disabled={!canSelectAll}
        >
          Tout sélectionner
        </ProtoBtn>
        <ProtoBtn
          className="h-8 shrink-0 px-2.5 text-[11px]"
          onClick={handleClearSelection}
          disabled={!canClearSelection}
        >
          Tout désélectionner
        </ProtoBtn>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200">
        {tab === "manual" ? (
          contactsLoading ? (
            <RecipientListSkeleton />
          ) : filteredContacts.length === 0 ? (
            <p className="m-0 px-3 py-8 text-center text-sm font-semibold text-slate-500">
              Aucun contact trouvé.
            </p>
          ) : (
            filteredContacts.map((c) => {
              const isUnsubscribed = c.stopSms || !c.optIn;
              const checked = isContactChecked(c);
              const av = avatarColor(c.id);
              const initials = contactInitials(c);
              return (
                <label
                  key={c.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2.5 last:border-b-0",
                    isUnsubscribed
                      ? "cursor-not-allowed bg-slate-50 opacity-70"
                      : checked
                      ? "bg-[#eef4ff]/80"
                      : "bg-white hover:bg-slate-50/80"
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 rounded border-slate-300 text-[#2f6fed]"
                    checked={checked}
                    disabled={isUnsubscribed || recipientMode === "all"}
                    onChange={() => toggleContact(c.id)}
                  />
                  <div
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-extrabold",
                      av.bg,
                      av.text
                    )}
                  >
                    {initials}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm font-extrabold",
                        isUnsubscribed ? "text-slate-400" : "text-slate-900"
                      )}
                    >
                      {contactDisplayName(c)}
                    </span>
                    <span
                      className={cn(
                        "block truncate text-xs font-semibold",
                        isUnsubscribed ? "text-slate-400" : "text-slate-500"
                      )}
                    >
                      {c.phone}
                      {isUnsubscribed ? " · Désabonné" : ""}
                    </span>
                  </span>
                  <div className="hidden min-w-0 max-w-[48%] shrink-0 flex-wrap justify-end gap-1 sm:flex">
                    {c.groups.length === 0 ? (
                      <span className="text-[11px] font-semibold text-slate-400">
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
                            title={g}
                          >
                            {g}
                          </span>
                        );
                      })
                    )}
                    {c.groups.length > 4 && (
                      <span
                        className="text-[11px] font-bold text-slate-400"
                        title={c.groups.slice(4).join(", ")}
                      >
                        +{c.groups.length - 4}
                      </span>
                    )}
                  </div>
                </label>
              );
            })
          )
        ) : groupsLoading ? (
          <RecipientListSkeleton />
        ) : filteredGroups.length === 0 ? (
          <p className="m-0 px-3 py-8 text-center text-sm font-semibold text-slate-500">
            {groups.length === 0
              ? "Aucun groupe créé."
              : "Aucun groupe trouvé."}
          </p>
        ) : (
          filteredGroups.map((g) => {
            const checked = selectedGroupNames.includes(g.name);
            const gc = groupColor(g.name);
            return (
              <label
                key={g.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2.5 last:border-b-0",
                  checked ? "bg-[#eef4ff]/80" : "bg-white hover:bg-slate-50/80"
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-[#2f6fed]"
                  checked={checked}
                  onChange={() => toggleGroup(g.name)}
                />
                <div
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs font-extrabold",
                    gc.bg,
                    gc.border,
                    gc.text
                  )}
                >
                  <Users className="h-4 w-4" aria-hidden />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-slate-900">
                    {g.name}
                  </span>
                  <span className="block truncate text-xs font-semibold text-slate-500">
                    {g.contactCount} contact
                    {g.contactCount !== 1 ? "s" : ""}
                    {g.description.trim() ? ` · ${g.description.trim()}` : ""}
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>

      {(recipientExcludedStop > 0 || recipientExcludedInvalid > 0) && (
        <p className="shrink-0 text-[11px] font-semibold text-slate-500">
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
    selectedGroupsDisplay,
    excludedTotal,
  } = useStep1Context();

  return (
    <aside
      className={cn(
        fieldBox,
        "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden py-3"
      )}
    >
      <h3 className="m-0 shrink-0 text-xs font-black text-slate-900">Résumé</h3>

      <SummaryStatBubble
        label="Contacts sélectionnés"
        value={contactsSelectedCount}
      />

      <SummaryStatBubble
        label="Groupes sélectionnés"
        value={selectedGroupsDisplay.length}
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
                  title={name}
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
          <p className="m-0 mt-1.5 text-[11px] font-semibold text-slate-400">
            Aucun groupe sélectionné
          </p>
        )}
      </SummaryStatBubble>

      <SummaryStatBubble label="Exclus (non éligibles)" value={excludedTotal} />

      {recipientMode === "all" && (
        <p className="m-0 shrink-0 text-[11px] font-semibold text-[#1f3b77]">
          Tous vos contacts éligibles sont inclus.
        </p>
      )}

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
