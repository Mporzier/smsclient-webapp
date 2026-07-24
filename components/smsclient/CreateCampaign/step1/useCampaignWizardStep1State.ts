"use client";

import { buildCampaignRecipientIdSet } from "@/lib/proto/smsPersonalization";
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
  resolvedGroupMemberIds?: readonly string[];
  groupMemberIdsByName?: Record<string, string[]>;
  recipientsResolving?: boolean;
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
  resolvedGroupMemberIds = [],
  groupMemberIdsByName = {},
  recipientsResolving = false,
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
      return effectiveSelectedIds.has(c.id);
    },
    [recipientMode, effectiveSelectedIds]
  );

  const contactsSelectedCount = useMemo(() => {
    if (recipientMode === "all") {
      return contacts.filter((c) => c.optIn && !c.stopSms).length;
    }
    return effectiveSelectedIds.size;
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
    setRecipientMode(selectedGroupNames.length > 0 ? "lists" : "manual");
  }, [
    selectedGroupNames.length,
    setSelectedContactIds,
    setRecipientMode,
  ]);

  const clearGroupSelection = useCallback(() => {
    setSelectedGroupNames([]);
    setRecipientMode(selectedContactIds.length > 0 ? "manual" : "manual");
  }, [selectedContactIds.length, setSelectedGroupNames, setRecipientMode]);

  const handleSelectAll = useCallback(() => {
    if (tab === "manual") selectAllVisibleContacts();
    else selectAllVisibleGroups();
  }, [tab, selectAllVisibleContacts, selectAllVisibleGroups]);

  const handleClearSelection = useCallback(() => {
    if (tab === "manual") clearManualSelection();
    else clearGroupSelection();
  }, [tab, clearManualSelection, clearGroupSelection]);

  const canSelectAll =
    tab === "manual"
      ? selectableFilteredContacts.length > 0 && recipientMode !== "all"
      : filteredGroups.length > 0;

  const canClearSelection =
    tab === "manual"
      ? recipientMode === "all" || selectedContactIds.length > 0
      : selectedGroupNames.length > 0;

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
    isContactChecked,
    toggleContact,
    toggleGroup,
    canSelectAll,
    canClearSelection,
    handleSelectAll,
    handleClearSelection,
    recipientMode,
    selectedGroupNames,
    recipients,
    contactsSelectedCount,
    selectedGroupsDisplay,
    excludedTotal,
    listHasMore,
    listLoadingMore,
    onListLoadMore,
    listRowCount,
    recipientsResolving,
  };
}

export type Step1ContextValue = ReturnType<typeof useCampaignWizardStep1State>;
