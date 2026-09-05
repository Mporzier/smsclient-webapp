"use client";

import { useGmailSelectAll } from "@/hooks/useGmailSelectAll";
import { buildCampaignRecipientIdSet } from "@/lib/proto/smsPersonalization";
import type { CampaignEligibleAudienceFilter } from "@/lib/proto/campaignAudience";
import type { ContactRowData } from "@/lib/types/contact";
import type { GroupRowData } from "@/lib/types/group";
import { useCallback, useMemo, useState } from "react";
import {
  normalizeGroupName,
  selectedGroupsForContact,
} from "./step1Helpers";

export type CampaignWizardStep1Props = {
  groups: GroupRowData[];
  groupsLoading: boolean;
  groupsLoadingMore?: boolean;
  groupsHasMore?: boolean;
  onGroupsLoadMore?: () => void;
  groupsSearchQuery?: string;
  onGroupsSearchChange?: (value: string) => void;
  contacts: ContactRowData[];
  contactsLoading: boolean;
  contactsLoadingMore?: boolean;
  contactsHasMore?: boolean;
  onContactsLoadMore?: () => void;
  contactsSearchQuery?: string;
  onContactsSearchChange?: (value: string) => void;
  contactsTotalCount?: number | null;
  groupsTotalCount?: number | null;
  recipientMode: "manual" | "lists" | "all" | "numbers";
  setRecipientMode: (v: "manual" | "lists" | "all" | "numbers") => void;
  selectedGroupNames: string[];
  setSelectedGroupNames: React.Dispatch<React.SetStateAction<string[]>>;
  selectedContactIds: string[];
  setSelectedContactIds: React.Dispatch<React.SetStateAction<string[]>>;
  /** Gmail expand — ne vide pas le filtre audience serveur. */
  setSelectedContactIdsFromGmail?: React.Dispatch<
    React.SetStateAction<string[]>
  >;
  excludedContactIds: string[];
  setExcludedContactIds: React.Dispatch<React.SetStateAction<string[]>>;
  eligibleAudienceFilter?: CampaignEligibleAudienceFilter | null;
  eligibleAudienceCount?: number | null;
  recipientExcludedStop: number;
  recipientExcludedInvalid: number;
  recipientCount: number;
  resolvedGroupMemberIds?: readonly string[];
  groupMemberIdsByName?: Record<string, string[]>;
  recipientsResolving?: boolean;
  onCountEligibleContacts?: (
    search: string,
  ) => Promise<{ count: number; error: Error | null }>;
  onFetchEligibleContactIds?: (
    search: string,
  ) => Promise<{ data: string[]; error: Error | null }>;
  onCountMatchingGroups?: (
    search: string,
  ) => Promise<{ count: number; error: Error | null }>;
  onFetchMatchingGroupNames?: (
    search: string,
  ) => Promise<{ data: string[]; error: Error | null }>;
  /** Quitte le wizard vers la vue Contacts puis ouvre la modale demandée. */
  onGoToContacts?: (intent: "add" | "import") => void;
  onGoToGroups?: () => void;
};

type RecipientTab = "manual" | "groups";

export function useCampaignWizardStep1State({
  groups,
  groupsLoading,
  groupsLoadingMore = false,
  groupsHasMore = false,
  onGroupsLoadMore,
  groupsSearchQuery = "",
  onGroupsSearchChange,
  contacts,
  contactsLoading,
  contactsLoadingMore = false,
  contactsHasMore = false,
  onContactsLoadMore,
  contactsSearchQuery = "",
  onContactsSearchChange,
  contactsTotalCount = null,
  groupsTotalCount = null,
  recipientMode,
  setRecipientMode,
  selectedGroupNames,
  setSelectedGroupNames,
  selectedContactIds,
  setSelectedContactIds,
  setSelectedContactIdsFromGmail,
  excludedContactIds,
  setExcludedContactIds,
  eligibleAudienceFilter = null,
  eligibleAudienceCount = null,
  recipientExcludedStop,
  recipientExcludedInvalid,
  recipientCount,
  resolvedGroupMemberIds = [],
  groupMemberIdsByName = {},
  recipientsResolving = false,
  onCountEligibleContacts,
  onFetchEligibleContactIds,
  onCountMatchingGroups,
  onFetchMatchingGroupNames,
  onGoToContacts,
  onGoToGroups,
}: CampaignWizardStep1Props) {
  const [tab, setTab] = useState<RecipientTab>("manual");

  const recipients = Math.max(0, recipientCount);

  const search = tab === "manual" ? contactsSearchQuery : groupsSearchQuery;
  const setSearch = useCallback(
    (value: string) => {
      if (tab === "manual") onContactsSearchChange?.(value);
      else onGroupsSearchChange?.(value);
    },
    [tab, onContactsSearchChange, onGroupsSearchChange],
  );

  const switchTab = useCallback(
    (next: RecipientTab) => {
      setTab(next);
      onContactsSearchChange?.("");
      onGroupsSearchChange?.("");
    },
    [onContactsSearchChange, onGroupsSearchChange],
  );

  const selectedIdsFromGroups = useMemo(
    () => new Set(resolvedGroupMemberIds),
    [resolvedGroupMemberIds]
  );

  /** Serveur filtre déjà via search — ici seulement tri abo / désabo. */
  const filteredContacts = useMemo(() => {
    const subscribed: ContactRowData[] = [];
    const unsubscribed: ContactRowData[] = [];
    for (const c of contacts) {
      if (c.stopSms || !c.optIn) unsubscribed.push(c);
      else subscribed.push(c);
    }
    return [...subscribed, ...unsubscribed];
  }, [contacts]);

  const filteredGroups = groups;

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
        resolvedGroupMemberIds,
      }),
    [
      contacts,
      recipientMode,
      selectedContactIds,
      selectedGroupNames,
      excludedContactIds,
      resolvedGroupMemberIds,
    ]
  );

  const isContactChecked = useCallback(
    (c: ContactRowData) => {
      if (c.stopSms || !c.optIn) return false;
      if (recipientMode === "all") return true;
      if (eligibleAudienceFilter) {
        return !excludedContactIds.includes(c.id);
      }
      return effectiveSelectedIds.has(c.id);
    },
    [
      recipientMode,
      eligibleAudienceFilter,
      excludedContactIds,
      effectiveSelectedIds,
    ],
  );

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
      if (eligibleAudienceFilter) {
        const checked = !excludedContactIds.includes(id);
        setExcludedContactIds((prev) =>
          checked ? [...prev, id] : prev.filter((x) => x !== id),
        );
        setRecipientMode(
          selectedGroupNames.length > 0 ? "lists" : "manual",
        );
        return;
      }

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
            : selectedGroupNames.filter((gName) =>
                (groupMemberIdsByName[gName] ?? []).includes(id)
              );
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
              for (const memberId of groupMemberIdsByName[gName] ?? []) {
                if (
                  memberId !== id &&
                  !excludedContactIds.includes(memberId)
                ) {
                  next.add(memberId);
                }
              }
            }
            next.delete(id);
            return Array.from(next);
          });
          setExcludedContactIds((prev) =>
            prev.filter((excludedId) => {
              for (const gName of affectedGroups) {
                if ((groupMemberIdsByName[gName] ?? []).includes(excludedId)) {
                  return false;
                }
              }
              return true;
            })
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
      eligibleAudienceFilter,
      recipientMode,
      contacts,
      selectedGroupNames,
      selectedIdsFromGroups,
      effectiveSelectedIds,
      excludedContactIds,
      groupMemberIdsByName,
      setRecipientMode,
      setSelectedContactIds,
      setSelectedGroupNames,
      setExcludedContactIds,
    ],
  );

  const toggleGroup = useCallback(
    (groupName: string) => {
      const isAdding = !selectedGroupNames.includes(groupName);
      const nextGroups = isAdding
        ? [...selectedGroupNames, groupName]
        : selectedGroupNames.filter((x) => x !== groupName);
      setSelectedGroupNames(nextGroups);

      if (isAdding) {
        const cached = groupMemberIdsByName[groupName];
        const memberIds =
          cached ??
          contacts
            .filter((c) =>
              c.groups.some(
                (g) =>
                  g.trim().toLowerCase() === groupName.trim().toLowerCase()
              )
            )
            .map((c) => c.id);
        if (memberIds.length > 0) {
          setExcludedContactIds((prev) =>
            prev.filter((id) => !memberIds.includes(id))
          );
        }
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
      groupMemberIdsByName,
      selectedGroupNames,
      selectedContactIds.length,
      setSelectedGroupNames,
      setExcludedContactIds,
      setRecipientMode,
    ]
  );

  const contactLoadedIds = useMemo(
    () => selectableFilteredContacts.map((c) => c.id),
    [selectableFilteredContacts],
  );

  const setContactIdsFromGmail = useCallback(
    (ids: string[]) => {
      (setSelectedContactIdsFromGmail ?? setSelectedContactIds)(ids);
      setExcludedContactIds([]);
      setRecipientMode(
        selectedGroupNames.length > 0
          ? "lists"
          : ids.length > 0 || eligibleAudienceFilter
            ? "manual"
            : "manual",
      );
    },
    [
      setSelectedContactIdsFromGmail,
      setSelectedContactIds,
      setExcludedContactIds,
      setRecipientMode,
      selectedGroupNames.length,
      eligibleAudienceFilter,
    ],
  );

  const countEligibleContacts = useCallback(async () => {
    if (!onCountEligibleContacts) {
      return { count: contactLoadedIds.length, error: null };
    }
    return onCountEligibleContacts(contactsSearchQuery);
  }, [onCountEligibleContacts, contactsSearchQuery, contactLoadedIds.length]);

  const fetchEligibleContactIds = useCallback(async () => {
    if (!onFetchEligibleContactIds) {
      return { data: contactLoadedIds, error: null };
    }
    return onFetchEligibleContactIds(contactsSearchQuery);
  }, [onFetchEligibleContactIds, contactsSearchQuery, contactLoadedIds]);

  const {
    selectLoaded: selectContactsLoaded,
    deselectLoaded: deselectContactsLoaded,
    clearSelection: clearContactsSelection,
    showExpandBanner: showContactsExpandBanner,
    matchTotal: contactsMatchTotal,
    displaySelectedCount: contactsDisplaySelectedCount,
    counting: contactsCounting,
    expanding: contactsExpanding,
    expandError: contactsExpandError,
    expandToMatchAll: expandContactsSelection,
    ensureSelectionReady: ensureContactsSelectionReady,
    allLoadedSelected: allLoadedContactsSelected,
  } = useGmailSelectAll({
    search: contactsSearchQuery,
    loadedIds: contactLoadedIds,
    selectedIds: selectedContactIds,
    setSelectedIds: setContactIdsFromGmail,
    countMatch: countEligibleContacts,
    fetchAllIds: fetchEligibleContactIds,
    expandCandidate:
      contactsHasMore ||
      (typeof contactsTotalCount === "number" &&
        contactsTotalCount > contactLoadedIds.length),
    listMatchTotal: contactsTotalCount,
  });

  const groupLoadedNames = useMemo(
    () => filteredGroups.map((g) => g.name),
    [filteredGroups],
  );

  const setGroupNamesFromGmail = useCallback(
    (names: string[]) => {
      setSelectedGroupNames(names);
      setRecipientMode(
        names.length > 0
          ? "lists"
          : selectedContactIds.length > 0
            ? "manual"
            : "manual",
      );
    },
    [setSelectedGroupNames, setRecipientMode, selectedContactIds.length],
  );

  const countGroupsMatch = useCallback(async () => {
    if (!onCountMatchingGroups) {
      return { count: groupLoadedNames.length, error: null };
    }
    return onCountMatchingGroups(groupsSearchQuery);
  }, [onCountMatchingGroups, groupsSearchQuery, groupLoadedNames.length]);

  const fetchGroupNamesMatch = useCallback(async () => {
    if (!onFetchMatchingGroupNames) {
      return { data: groupLoadedNames, error: null };
    }
    return onFetchMatchingGroupNames(groupsSearchQuery);
  }, [onFetchMatchingGroupNames, groupsSearchQuery, groupLoadedNames]);

  const {
    selectLoaded: selectGroupsLoaded,
    deselectLoaded: deselectGroupsLoaded,
    clearSelection: clearGroupsSelection,
    showExpandBanner: showGroupsExpandBanner,
    matchTotal: groupsMatchTotal,
    displaySelectedCount: groupsDisplaySelectedCount,
    counting: groupsCounting,
    expanding: groupsExpanding,
    expandError: groupsExpandError,
    expandToMatchAll: expandGroupsSelection,
    ensureSelectionReady: ensureGroupsSelectionReady,
  } = useGmailSelectAll({
    search: groupsSearchQuery,
    loadedIds: groupLoadedNames,
    selectedIds: selectedGroupNames,
    setSelectedIds: setGroupNamesFromGmail,
    countMatch: countGroupsMatch,
    fetchAllIds: fetchGroupNamesMatch,
    expandCandidate:
      groupsHasMore ||
      (typeof groupsTotalCount === "number" &&
        groupsTotalCount > groupLoadedNames.length),
    listMatchTotal: groupsTotalCount,
  });

  const contactsSelectedCount = useMemo(() => {
    if (eligibleAudienceFilter && eligibleAudienceCount != null) {
      return Math.max(0, eligibleAudienceCount - excludedContactIds.length);
    }
    if (recipientMode === "all") {
      return contacts.filter((c) => c.optIn && !c.stopSms).length;
    }
    return Math.max(contactsDisplaySelectedCount, effectiveSelectedIds.size);
  }, [
    eligibleAudienceFilter,
    eligibleAudienceCount,
    excludedContactIds.length,
    recipientMode,
    contacts,
    effectiveSelectedIds,
    contactsDisplaySelectedCount,
  ]);

  const allLoadedContactsSelectedResolved = useMemo(() => {
    if (eligibleAudienceFilter) {
      return (
        selectableFilteredContacts.length > 0 &&
        selectableFilteredContacts.every(
          (c) => !excludedContactIds.includes(c.id),
        )
      );
    }
    return allLoadedContactsSelected;
  }, [
    eligibleAudienceFilter,
    selectableFilteredContacts,
    excludedContactIds,
    allLoadedContactsSelected,
  ]);

  const listSelectionCount =
    tab === "manual" ? contactsSelectedCount : groupsDisplaySelectedCount;

  const handleSelectAll = useCallback(() => {
    if (tab === "manual") selectContactsLoaded();
    else selectGroupsLoaded();
  }, [tab, selectContactsLoaded, selectGroupsLoaded]);

  const allLoadedGroupsSelected = useMemo(
    () =>
      filteredGroups.length > 0 &&
      filteredGroups.every((g) => selectedGroupNames.includes(g.name)),
    [filteredGroups, selectedGroupNames],
  );

  const toggleAllLoadedContacts = useCallback(() => {
    const allSelected = eligibleAudienceFilter
      ? allLoadedContactsSelectedResolved
      : allLoadedContactsSelected;

    if (allSelected) {
      const clearEntireSelection =
        eligibleAudienceFilter ||
        contactsSelectedCount > selectableFilteredContacts.length;
      if (clearEntireSelection) {
        setSelectedContactIds([]);
        setExcludedContactIds([]);
        clearContactsSelection();
      } else {
        deselectContactsLoaded();
      }
      return;
    }

    if (eligibleAudienceFilter) {
      setExcludedContactIds((prev) =>
        prev.filter(
          (id) => !selectableFilteredContacts.some((c) => c.id === id),
        ),
      );
      return;
    }
    selectContactsLoaded();
  }, [
    eligibleAudienceFilter,
    allLoadedContactsSelectedResolved,
    allLoadedContactsSelected,
    contactsSelectedCount,
    selectableFilteredContacts,
    setSelectedContactIds,
    setExcludedContactIds,
    clearContactsSelection,
    deselectContactsLoaded,
    selectContactsLoaded,
  ]);

  const toggleAllLoadedGroups = useCallback(() => {
    if (allLoadedGroupsSelected) {
      deselectGroupsLoaded();
      return;
    }
    selectGroupsLoaded();
  }, [allLoadedGroupsSelected, deselectGroupsLoaded, selectGroupsLoaded]);

  const contactsPagePartiallySelected = eligibleAudienceFilter
    ? !allLoadedContactsSelectedResolved &&
      selectableFilteredContacts.some((c) =>
        excludedContactIds.includes(c.id),
      )
    : !allLoadedContactsSelected &&
      selectableFilteredContacts.some((c) =>
        selectedContactIds.includes(c.id),
      );

  const handleClearSelection = useCallback(() => {
    if (tab === "manual") {
      setSelectedContactIds([]);
      setExcludedContactIds([]);
      clearContactsSelection();
      return;
    }
    clearGroupsSelection();
  }, [
    tab,
    setSelectedContactIds,
    setExcludedContactIds,
    clearContactsSelection,
    clearGroupsSelection,
  ]);

  const ensureSelectionReady = useCallback(async () => {
    const [contactIds, groupNames] = await Promise.all([
      ensureContactsSelectionReady(),
      ensureGroupsSelectionReady(),
    ]);
    return { contactIds, groupNames };
  }, [ensureContactsSelectionReady, ensureGroupsSelectionReady]);

  const canSelectAll =
    tab === "manual"
      ? selectableFilteredContacts.length > 0
      : filteredGroups.length > 0;

  const canClearSelection =
    tab === "manual"
      ? contactsSelectedCount > 0
      : groupsDisplaySelectedCount > 0;

  const expandBanner =
    tab === "manual"
      ? {
          show: showContactsExpandBanner,
          matchTotal: contactsMatchTotal,
          counting: contactsCounting,
          expanding: contactsExpanding,
          expandError: contactsExpandError,
          hasSearch: contactsSearchQuery.trim().length > 0,
          entityLabel: "contacts éligibles",
          onExpand: () => void expandContactsSelection(),
        }
      : {
          show: showGroupsExpandBanner,
          matchTotal: groupsMatchTotal,
          counting: groupsCounting,
          expanding: groupsExpanding,
          expandError: groupsExpandError,
          hasSearch: groupsSearchQuery.trim().length > 0,
          entityLabel: "groupes",
          onExpand: () => void expandGroupsSelection(),
        };

  const listHasMore = tab === "manual" ? contactsHasMore : groupsHasMore;
  const listLoadingMore =
    tab === "manual" ? contactsLoadingMore : groupsLoadingMore;
  const onListLoadMore =
    tab === "manual" ? onContactsLoadMore : onGroupsLoadMore;
  const listRowCount =
    tab === "manual" ? filteredContacts.length : filteredGroups.length;

  return {
    tab,
    setTab: switchTab,
    search,
    setSearch,
    groups,
    groupsLoading,
    contactsLoading,
    recipientExcludedStop,
    recipientExcludedInvalid,
    filteredContacts,
    filteredGroups,
    selectableFilteredContacts,
    isContactChecked,
    toggleContact,
    toggleGroup,
    canSelectAll,
    canClearSelection,
    handleSelectAll,
    handleClearSelection,
    allLoadedContactsSelected: allLoadedContactsSelectedResolved,
    allLoadedGroupsSelected,
    contactsPagePartiallySelected,
    toggleAllLoadedContacts,
    toggleAllLoadedGroups,
    ensureSelectionReady,
    recipientMode,
    selectedGroupNames,
    recipients,
    contactsSelectedCount,
    groupsSelectedCount: groupsDisplaySelectedCount,
    listSelectionCount,
    selectedGroupsDisplay,
    excludedTotal,
    listHasMore,
    listLoadingMore,
    onListLoadMore,
    listRowCount,
    recipientsResolving,
    selectionPreparing: contactsExpanding || groupsExpanding,
    expandBanner,
    onGoToContacts,
    onGoToGroups,
  };
}

export type Step1ContextValue = ReturnType<typeof useCampaignWizardStep1State>;
