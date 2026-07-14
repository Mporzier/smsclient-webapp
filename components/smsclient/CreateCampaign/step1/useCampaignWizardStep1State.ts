"use client";

import { buildCampaignRecipientIdSet } from "@/lib/proto/smsPersonalization";
import type { ContactRowData } from "@/lib/types/contact";
import type { GroupRowData } from "@/lib/types/group";
import { useCallback, useMemo, useState } from "react";
import {
  contactBelongsToGroup,
  contactMatchesSearch,
  groupMatchesSearch,
  normalizeGroupName,
  selectedGroupsForContact,
} from "./step1Helpers";

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

type RecipientTab = "manual" | "groups";

export function useCampaignWizardStep1State({
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

export type Step1ContextValue = ReturnType<typeof useCampaignWizardStep1State>;
