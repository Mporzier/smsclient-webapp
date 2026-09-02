"use client";

import { buildDefaultCampaignTitle } from "@/components/smsclient/CreateCampaign/campaignTextUtils";
import type { SmsComposeApproach } from "@/components/smsclient/CreateCampaign/SmsComposeApproachCards";
import { insertSmsCampaign } from "@/lib/supabase/campaigns";
import {
  countClientIds,
  fetchClientIds,
  fetchClientsByIds,
  fetchGroupMemberClientIds,
  stampLastSmsOnContacts,
} from "@/lib/supabase/clients";
import {
  countMatchingGroups,
  fetchMatchingGroups,
} from "@/lib/supabase/groups";
import { buildCampaignRecipientIdSet } from "@/lib/proto/smsPersonalization";
import { isValidFrMobile } from "@/lib/proto/smsUtils";
import { parisLocalToISO } from "@/lib/proto/timezone";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  clearCampaignWizardSession,
  getStoredCampaignWizardStep,
  resolveCampaignWizardStep,
  setStoredCampaignWizardStep,
  type CampaignWizardStep,
} from "@/lib/proto/campaignWizardSession";
import {
  type CampaignWizardFormSnapshot,
  isCampaignWizardDirty,
} from "@/lib/proto/campaignWizardDirty";
import type { AppRoute } from "@/lib/proto/routes";
import type { ContactRowData } from "@/lib/types/contact";
import type { GroupRowData } from "@/lib/types/group";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { DEFAULT_SMS } from "./constants";
import {
  defaultCampaignTitle,
  parseManualNumbers,
  plusTenMinutesLocalValue,
} from "./helpers";
import type { CampaignComposerPreset, PendingWizardLeaveAction } from "./types";

type CampaignWizardOptions = {
  route: AppRoute;
  go: (path: string) => void;
  smsSender: string;
  contacts: ContactRowData[];
  groupRows: GroupRowData[];
  groupsLoading: boolean;
  groupsLoadingMore?: boolean;
  groupsHasMore?: boolean;
  onGroupsLoadMore?: () => void;
  groupsSearchQuery?: string;
  onGroupsSearchChange?: (value: string) => void;
  contactsLoading: boolean;
  contactsLoadingMore?: boolean;
  contactsHasMore?: boolean;
  onContactsLoadMore?: () => void;
  contactsSearchQuery?: string;
  onContactsSearchChange?: (value: string) => void;
  creditsBalance: number;
  supabase: SupabaseClient;
  userId: string | undefined;
  onCampaignSaved: () => Promise<void>;
};

export function useCampaignWizard({
  route,
  go,
  smsSender,
  contacts,
  groupRows,
  groupsLoading,
  groupsLoadingMore = false,
  groupsHasMore = false,
  onGroupsLoadMore,
  groupsSearchQuery = "",
  onGroupsSearchChange,
  contactsLoading,
  contactsLoadingMore = false,
  contactsHasMore = false,
  onContactsLoadMore,
  contactsSearchQuery = "",
  onContactsSearchChange,
  creditsBalance,
  supabase,
  userId,
  onCampaignSaved,
}: CampaignWizardOptions) {
  const [campaignRecipientMode, setCampaignRecipientMode] = useState<
    "manual" | "lists" | "all" | "numbers"
  >("manual");
  const [campaignSelectedGroupNames, setCampaignSelectedGroupNames] = useState<
    string[]
  >([]);
  const [campaignSelectedContactIds, setCampaignSelectedContactIds] = useState<
    string[]
  >([]);
  const [campaignExcludedContactIds, setCampaignExcludedContactIds] = useState<
    string[]
  >([]);
  const [campaignManualNumbers, setCampaignManualNumbers] = useState("");
  const [campaignTitle, setCampaignTitle] = useState(defaultCampaignTitle());
  const [campaignSender, setCampaignSender] = useState(smsSender);
  const [smsBody, setSmsBody] = useState(DEFAULT_SMS);
  const [sendMode, setSendMode] = useState<"now" | "sched">("now");
  const [scheduledAt, setScheduledAt] = useState(plusTenMinutesLocalValue());
  const [aiOpen, setAiOpen] = useState(false);
  const [campaignWizardStep, setCampaignWizardStep] =
    useState<CampaignWizardStep>(1);
  const [campaignComposeApproach, setCampaignComposeApproach] =
    useState<SmsComposeApproach | null>(null);
  const [leaveWizardConfirmOpen, setLeaveWizardConfirmOpen] = useState(false);

  const [initialWizardSnapshot, setInitialWizardSnapshot] =
    useState<CampaignWizardFormSnapshot | null>(null);
  const pendingWizardLeaveActionRef = useRef<PendingWizardLeaveAction | null>(
    null
  );
  const wizardGuardRanRef = useRef(false);

  /** Cache membres par nom de groupe (indépendant lazy list). */
  const [groupMemberIdsByName, setGroupMemberIdsByName] = useState<
    Record<string, string[]>
  >({});
  const [resolvedRecipientContacts, setResolvedRecipientContacts] = useState<
    ContactRowData[]
  >([]);
  const [recipientsResolving, setRecipientsResolving] = useState(false);
  const groupMemberCacheRef = useRef<Record<string, string[]>>({});
  const groupResolveGenRef = useRef(0);
  const contactsResolveGenRef = useRef(0);

  const resolvedGroupMemberIds = useMemo(() => {
    const ids: string[] = [];
    for (const name of campaignSelectedGroupNames) {
      const members = groupMemberIdsByName[name];
      if (members) ids.push(...members);
    }
    return ids;
  }, [campaignSelectedGroupNames, groupMemberIdsByName]);

  const recipientIdSet = useMemo(
    () =>
      buildCampaignRecipientIdSet({
        contacts,
        recipientMode: campaignRecipientMode,
        selectedContactIds: campaignSelectedContactIds,
        selectedGroupNames: campaignSelectedGroupNames,
        excludedContactIds: campaignExcludedContactIds,
        resolvedGroupMemberIds,
      }),
    [
      contacts,
      campaignRecipientMode,
      campaignSelectedContactIds,
      campaignSelectedGroupNames,
      campaignExcludedContactIds,
      resolvedGroupMemberIds,
    ]
  );

  const recipientIdsKey = useMemo(
    () => Array.from(recipientIdSet).sort().join("\0"),
    [recipientIdSet]
  );

  // Résoudre IDs membres pour chaque groupe sélectionné.
  useEffect(() => {
    let cancelled = false;
    const gen = ++groupResolveGenRef.current;

    const run = async () => {
      if (campaignSelectedGroupNames.length === 0) {
        if (!cancelled && gen === groupResolveGenRef.current) {
          setGroupMemberIdsByName({});
        }
        return;
      }

      setRecipientsResolving(true);
      const next: Record<string, string[]> = {};
      for (const name of campaignSelectedGroupNames) {
        const cached = groupMemberCacheRef.current[name];
        if (cached) {
          next[name] = cached;
          continue;
        }
        const row = groupRows.find(
          (g) => g.name.trim().toLowerCase() === name.trim().toLowerCase()
        );
        if (!row) {
          next[name] = [];
          continue;
        }
        const { data, error } = await fetchGroupMemberClientIds(
          supabase,
          row.id
        );
        if (cancelled || gen !== groupResolveGenRef.current) return;
        if (error) {
          next[name] = [];
          continue;
        }
        groupMemberCacheRef.current[name] = data;
        next[name] = data;
      }
      if (!cancelled && gen === groupResolveGenRef.current) {
        setGroupMemberIdsByName(next);
        const allMemberIds = new Set<string>();
        for (const ids of Object.values(next)) {
          for (const id of ids) allMemberIds.add(id);
        }
        if (allMemberIds.size > 0) {
          setCampaignExcludedContactIds((prev) => {
            const filtered = prev.filter((id) => !allMemberIds.has(id));
            return filtered.length === prev.length ? prev : filtered;
          });
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [campaignSelectedGroupNames, groupRows, supabase]);

  // Charger ContactRowData pour tous les IDs destinataires (hors mode numbers).
  useEffect(() => {
    let cancelled = false;
    const gen = ++contactsResolveGenRef.current;

    const run = async () => {
      if (campaignRecipientMode === "numbers") {
        if (!cancelled && gen === contactsResolveGenRef.current) {
          setResolvedRecipientContacts([]);
          setRecipientsResolving(false);
        }
        return;
      }

      const groupsPending = campaignSelectedGroupNames.some(
        (name) => groupMemberIdsByName[name] == null
      );
      if (groupsPending) {
        setRecipientsResolving(true);
        return;
      }

      const ids = recipientIdsKey ? recipientIdsKey.split("\0") : [];
      if (ids.length === 0) {
        if (!cancelled && gen === contactsResolveGenRef.current) {
          setResolvedRecipientContacts([]);
          setRecipientsResolving(false);
        }
        return;
      }

      setRecipientsResolving(true);
      const { data, error } = await fetchClientsByIds(supabase, ids);
      if (cancelled || gen !== contactsResolveGenRef.current) return;
      if (error) {
        setResolvedRecipientContacts([]);
        setRecipientsResolving(false);
        return;
      }
      const byId = new Map(data.map((c) => [c.id, c]));
      setResolvedRecipientContacts(
        ids.map((id) => byId.get(id)).filter(Boolean) as ContactRowData[]
      );
      setRecipientsResolving(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    campaignRecipientMode,
    campaignSelectedGroupNames,
    groupMemberIdsByName,
    recipientIdsKey,
    supabase,
  ]);

  const campaignSelectedContacts = resolvedRecipientContacts;

  const campaignManualNumberStats = useMemo(() => {
    const numbers = parseManualNumbers(campaignManualNumbers);
    const invalid = numbers.filter((n) => !isValidFrMobile(n)).length;
    const eligible = Math.max(0, numbers.length - invalid);
    return { raw: numbers.length, stop: 0, invalid, eligible };
  }, [campaignManualNumbers]);

  const campaignExcludedStop = useMemo(
    () =>
      campaignRecipientMode === "numbers"
        ? campaignManualNumberStats.stop
        : campaignSelectedContacts.filter((c) => c.stopSms).length,
    [campaignRecipientMode, campaignSelectedContacts, campaignManualNumberStats]
  );

  const campaignExcludedInvalid = useMemo(
    () =>
      campaignRecipientMode === "numbers"
        ? campaignManualNumberStats.invalid
        : campaignSelectedContacts.filter(
            (c) => !isValidFrMobile(c.phone) || !c.optIn
          ).length,
    [campaignRecipientMode, campaignSelectedContacts, campaignManualNumberStats]
  );

  const campaignRecipientCount = useMemo(
    () =>
      campaignRecipientMode === "numbers"
        ? campaignManualNumberStats.eligible
        : campaignSelectedContacts.filter(
            (c) => c.optIn && !c.stopSms && isValidFrMobile(c.phone)
          ).length,
    [campaignRecipientMode, campaignSelectedContacts, campaignManualNumberStats]
  );

  const campaignRecipientSelectedRaw = useMemo(
    () =>
      campaignRecipientMode === "numbers"
        ? campaignManualNumberStats.raw
        : campaignSelectedContacts.length,
    [campaignRecipientMode, campaignManualNumberStats, campaignSelectedContacts]
  );

  const handleWizardStepChange = useCallback((step: CampaignWizardStep) => {
    setCampaignWizardStep(step);
    setStoredCampaignWizardStep(step);
  }, []);

  const clearListSearches = useCallback(() => {
    onContactsSearchChange?.("");
    onGroupsSearchChange?.("");
  }, [onContactsSearchChange, onGroupsSearchChange]);

  const handleWizardExit = useCallback(() => {
    clearCampaignWizardSession();
    setCampaignWizardStep(1);
    setCampaignComposeApproach(null);
    clearListSearches();
    setGroupMemberIdsByName({});
    setResolvedRecipientContacts([]);
    setRecipientsResolving(false);
  }, [clearListSearches]);

  const buildCurrentWizardSnapshot = useCallback(
    (): CampaignWizardFormSnapshot => ({
      step: campaignWizardStep,
      title: campaignTitle,
      sender: campaignSender,
      sms: smsBody,
      sendMode,
      scheduleAt: scheduledAt,
      recipientMode: campaignRecipientMode,
      manualNumbers: campaignManualNumbers,
      selectedContactIds: campaignSelectedContactIds,
      selectedGroupNames: campaignSelectedGroupNames,
      excludedContactIds: campaignExcludedContactIds,
      composeApproach: campaignComposeApproach,
    }),
    [
      campaignWizardStep,
      campaignTitle,
      campaignSender,
      smsBody,
      sendMode,
      scheduledAt,
      campaignRecipientMode,
      campaignManualNumbers,
      campaignSelectedContactIds,
      campaignSelectedGroupNames,
      campaignExcludedContactIds,
      campaignComposeApproach,
    ]
  );

  const wizardIsDirty = useMemo(() => {
    if (route !== "nouvelle-campagne" || !initialWizardSnapshot) {
      return false;
    }
    return isCampaignWizardDirty(
      buildCurrentWizardSnapshot(),
      initialWizardSnapshot
    );
  }, [route, buildCurrentWizardSnapshot, initialWizardSnapshot]);

  const openCampaignComposerInternal = useCallback(
    (preset?: CampaignComposerPreset) => {
      let recipientMode: "manual" | "lists" | "numbers" = "manual";
      let contactIds: string[] = [];
      let groupNames: string[] = [];
      let manualNumbers = "";

      if (typeof preset === "string") {
        const name = preset.trim();
        if (name) {
          recipientMode = "lists";
          groupNames = [name];
        }
      } else if (preset?.groupNames?.length) {
        recipientMode = "lists";
        groupNames = preset.groupNames;
      } else if (preset?.manualNumbers?.trim()) {
        recipientMode = "numbers";
        manualNumbers = preset.manualNumbers;
      } else if (preset?.contactIds?.length) {
        recipientMode = "manual";
        contactIds = preset.contactIds;
      }

      const presetObject = typeof preset === "string" ? undefined : preset;
      const nextTitle = presetObject?.title?.trim() || defaultCampaignTitle();
      const nextSender = presetObject?.sender?.trim() || smsSender;
      const nextSms = presetObject?.sms ?? "";
      const nextSendMode = presetObject?.sendMode ?? "now";
      const nextStep = presetObject?.step ?? 1;
      const nextApproach: SmsComposeApproach | null = nextSms.trim()
        ? "manual"
        : null;
      const nextScheduleAt = plusTenMinutesLocalValue();

      setCampaignRecipientMode(recipientMode);
      setCampaignTitle(nextTitle);
      setCampaignSender(nextSender);
      setSmsBody(nextSms);
      setSendMode(nextSendMode);
      setScheduledAt(nextScheduleAt);
      setAiOpen(false);
      setCampaignSelectedContactIds(contactIds);
      setCampaignExcludedContactIds([]);
      setCampaignSelectedGroupNames(groupNames);
      setCampaignManualNumbers(manualNumbers);
      setCampaignComposeApproach(nextApproach);
      setCampaignWizardStep(nextStep);
      setStoredCampaignWizardStep(nextStep);
      clearListSearches();

      /** Étape imposée par le preset : ne pas la faire retomber par le guard. */
      if (nextStep > 1) wizardGuardRanRef.current = true;

      setInitialWizardSnapshot({
        step: nextStep,
        title: nextTitle,
        sender: nextSender,
        sms: nextSms,
        sendMode: nextSendMode,
        scheduleAt: nextScheduleAt,
        recipientMode,
        manualNumbers,
        selectedContactIds: contactIds,
        selectedGroupNames: groupNames,
        excludedContactIds: [],
        composeApproach: nextApproach,
      });

      go("nouvelle-campagne");
    },
    [go, smsSender, clearListSearches]
  );

  const confirmWizardLeave = useCallback(() => {
    setLeaveWizardConfirmOpen(false);
    handleWizardExit();
    const action = pendingWizardLeaveActionRef.current;
    pendingWizardLeaveActionRef.current = null;
    if (!action) return;
    if (action.type === "navigate") {
      go(action.path);
      action.after?.();
      return;
    }
    openCampaignComposerInternal(action.preset);
  }, [go, handleWizardExit, openCampaignComposerInternal]);

  const requestWizardLeave = useCallback(
    (path = "campagnes", after?: () => void) => {
      if (!wizardIsDirty) {
        handleWizardExit();
        go(path);
        after?.();
        return;
      }
      pendingWizardLeaveActionRef.current = { type: "navigate", path, after };
      setLeaveWizardConfirmOpen(true);
    },
    [wizardIsDirty, handleWizardExit, go]
  );

  const guardedGo = useCallback(
    (path: string) => {
      const normalized = path.startsWith("#") ? path.slice(1) : path;
      if (
        route === "nouvelle-campagne" &&
        normalized !== "nouvelle-campagne" &&
        wizardIsDirty
      ) {
        pendingWizardLeaveActionRef.current = {
          type: "navigate",
          path: normalized,
        };
        setLeaveWizardConfirmOpen(true);
        return;
      }
      go(normalized);
    },
    [route, wizardIsDirty, go]
  );

  const openCampaignComposer = useCallback(
    (preset?: CampaignComposerPreset) => {
      if (route === "nouvelle-campagne" && wizardIsDirty) {
        pendingWizardLeaveActionRef.current = { type: "open", preset };
        setLeaveWizardConfirmOpen(true);
        return;
      }
      openCampaignComposerInternal(preset);
    },
    [route, wizardIsDirty, openCampaignComposerInternal]
  );

  useEffect(() => {
    if (route !== "nouvelle-campagne") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!wizardIsDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [route, wizardIsDirty]);

  if (route === "nouvelle-campagne") {
    if (initialWizardSnapshot === null) {
      setInitialWizardSnapshot(buildCurrentWizardSnapshot());
    }
  } else if (initialWizardSnapshot !== null) {
    setInitialWizardSnapshot(null);
  }

  useEffect(() => {
    if (route !== "nouvelle-campagne") {
      wizardGuardRanRef.current = false;
      return;
    }
    if (wizardGuardRanRef.current) return;
    wizardGuardRanRef.current = true;

    const { step } = resolveCampaignWizardStep({
      storedStep: getStoredCampaignWizardStep(),
      recipientCount: campaignRecipientCount,
      sms: smsBody,
    });
    setCampaignWizardStep(step);
    setStoredCampaignWizardStep(step);
  }, [route, campaignRecipientCount, smsBody]);

  const handleCampaignConfirm = useCallback(async () => {
    if (!userId) {
      throw new Error(
        "Vous devez être connecté pour enregistrer une campagne."
      );
    }
    const targetContacts =
      campaignRecipientMode !== "numbers"
        ? campaignSelectedContacts
            .filter((c) => c.optIn && !c.stopSms && isValidFrMobile(c.phone))
            .map((c) => ({
              firstName: c.firstName,
              lastName: c.lastName,
              phone: c.phone,
            }))
        : undefined;

    const { error } = await insertSmsCampaign(supabase, userId, {
      title: campaignTitle.trim() || buildDefaultCampaignTitle(),
      sender: campaignSender,
      body: smsBody,
      sendMode,
      recipientCount: campaignRecipientCount,
      scheduledAt:
        sendMode === "sched"
          ? (() => {
              const iso = parisLocalToISO(scheduledAt);
              if (Number.isNaN(new Date(iso).getTime())) {
                throw new Error("Date de programmation invalide.");
              }
              return iso;
            })()
          : null,
      targetContacts,
      targetGroups:
        campaignSelectedGroupNames.length > 0
          ? campaignSelectedGroupNames
          : undefined,
    });
    if (error) throw error;
    if (campaignRecipientMode !== "numbers") {
      const ids = campaignSelectedContacts
        .filter((c) => c.optIn && !c.stopSms && isValidFrMobile(c.phone))
        .map((c) => c.id);
      await stampLastSmsOnContacts(supabase, ids, smsBody);
    }
    await onCampaignSaved();
    toast("Campagne enregistrée");
  }, [
    userId,
    supabase,
    campaignRecipientMode,
    campaignSelectedContacts,
    campaignTitle,
    campaignSender,
    smsBody,
    sendMode,
    campaignRecipientCount,
    scheduledAt,
    campaignSelectedGroupNames,
    onCampaignSaved,
  ]);

  const campaignWizardProps = {
    step: campaignWizardStep,
    onWizardStepChange: handleWizardStepChange,
    onWizardExit: handleWizardExit,
    requestWizardLeave,
    onComposeApproachChange: setCampaignComposeApproach,
    go,
    title: campaignTitle,
    setTitle: setCampaignTitle,
    sender: campaignSender,
    setSender: setCampaignSender,
    sms: smsBody,
    setSms: setSmsBody,
    sendMode,
    setSendMode,
    scheduleAt: scheduledAt,
    setScheduleAt: setScheduledAt,
    aiOpen,
    setAiOpen,
    groups: groupRows,
    groupsLoading,
    groupsLoadingMore,
    groupsHasMore,
    onGroupsLoadMore,
    groupsSearchQuery,
    onGroupsSearchChange,
    contacts,
    contactsLoading,
    contactsLoadingMore,
    contactsHasMore,
    onContactsLoadMore,
    contactsSearchQuery,
    onContactsSearchChange,
    selectedGroupNames: campaignSelectedGroupNames,
    setSelectedGroupNames: setCampaignSelectedGroupNames,
    recipientMode: campaignRecipientMode,
    setRecipientMode: setCampaignRecipientMode,
    manualNumbers: campaignManualNumbers,
    setManualNumbers: setCampaignManualNumbers,
    selectedContactIds: campaignSelectedContactIds,
    setSelectedContactIds: setCampaignSelectedContactIds,
    excludedContactIds: campaignExcludedContactIds,
    setExcludedContactIds: setCampaignExcludedContactIds,
    recipientSelectedRaw: campaignRecipientSelectedRaw,
    recipientExcludedStop: campaignExcludedStop,
    recipientExcludedInvalid: campaignExcludedInvalid,
    recipientCount: campaignRecipientCount,
    resolvedGroupMemberIds,
    groupMemberIdsByName,
    resolvedContacts: campaignSelectedContacts,
    recipientsResolving,
    onCountEligibleContacts: (search: string) =>
      countClientIds(supabase, { search, eligibleOnly: true }),
    onFetchEligibleContactIds: (search: string) =>
      fetchClientIds(supabase, { search, eligibleOnly: true }),
    onCountMatchingGroups: (search: string) =>
      userId
        ? countMatchingGroups(supabase, userId, { search })
        : Promise.resolve({ count: 0, error: null }),
    onFetchMatchingGroupNames: async (search: string) => {
      if (!userId) return { data: [], error: null };
      const { data, error } = await fetchMatchingGroups(supabase, userId, {
        search,
      });
      if (error) return { data: [], error };
      return { data: data.map((g) => g.name), error: null };
    },
    creditsAvailable: creditsBalance,
    onConfirmCampaign: handleCampaignConfirm,
  } as const;

  return {
    campaignWizardStep,
    campaignWizardProps,
    guardedGo,
    openCampaignComposer,
    leaveWizardConfirmOpen,
    setLeaveWizardConfirmOpen,
    pendingWizardLeaveActionRef,
    confirmWizardLeave,
  };
}

export type CampaignWizardState = ReturnType<typeof useCampaignWizard>;
