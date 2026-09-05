"use client";

import { buildDefaultCampaignTitle } from "@/components/smsclient/CreateCampaign/campaignTextUtils";
import type { SmsComposeApproach } from "@/components/smsclient/CreateCampaign/SmsComposeApproachCards";
import { insertSmsCampaign } from "@/lib/supabase/campaigns";
import { fetchCampaignMergeFillCounts } from "@/lib/supabase/campaignMergeFill";
import {
  fetchClientsForCampaignRpc,
  listClientIdsRpc,
} from "@/lib/supabase/campaignAudience";
import {
  countClientIds,
  fetchGroupMemberClientIds,
  stampLastSmsOnContacts,
} from "@/lib/supabase/clients";
import type { CustomFieldDef } from "@/lib/types/customFields";
import {
  EMPTY_MERGE_FILL_COUNTS,
  type MergeFillCounts,
  type MergeFillStatus,
} from "@/lib/proto/smsMergeFill";
import {
  countMatchingGroups,
  fetchMatchingGroups,
} from "@/lib/supabase/groups";
import { buildCampaignRecipientIdSet } from "@/lib/proto/smsPersonalization";
import {
  CAMPAIGN_AUDIENCE_FILTER_THRESHOLD,
  type CampaignEligibleAudienceFilter,
} from "@/lib/proto/campaignAudience";
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
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from "react";
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
  contactsTotalCount?: number | null;
  groupsTotalCount?: number | null;
  creditsBalance: number;
  supabase: SupabaseClient;
  userId: string | undefined;
  customFieldDefs?: CustomFieldDef[];
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
  contactsTotalCount = null,
  groupsTotalCount = null,
  creditsBalance,
  supabase,
  userId,
  customFieldDefs = [],
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
  const [campaignEligibleAudience, setCampaignEligibleAudience] =
    useState<CampaignEligibleAudienceFilter | null>(null);
  const [campaignEligibleAudienceCount, setCampaignEligibleAudienceCount] =
    useState<number | null>(null);
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
  const resolvedContactsCacheRef = useRef<{
    key: string;
    rows: ContactRowData[];
  } | null>(null);
  const mergeFillGenRef = useRef(0);
  const [mergeFillCounts, setMergeFillCounts] = useState<MergeFillCounts>(
    EMPTY_MERGE_FILL_COUNTS,
  );
  const [mergeFillStatus, setMergeFillStatus] =
    useState<MergeFillStatus>("loading");

  const resolvedGroupMemberIds = useMemo(() => {
    const ids: string[] = [];
    for (const name of campaignSelectedGroupNames) {
      const members = groupMemberIdsByName[name];
      if (members != null) ids.push(...members);
    }
    return ids;
  }, [campaignSelectedGroupNames, groupMemberIdsByName]);

  const listsRecipientCountEstimate = useMemo(() => {
    if (campaignRecipientMode !== "lists") return null;
    const ids = new Set(campaignSelectedContactIds);
    let pendingEstimate = 0;

    for (const name of campaignSelectedGroupNames) {
      const members = groupMemberIdsByName[name];
      const row = groupRows.find(
        (g) => g.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      if (members != null) {
        if (members.length > 0) {
          for (const id of members) ids.add(id);
        } else if ((row?.contactCount ?? 0) > 0) {
          pendingEstimate += row?.contactCount ?? 0;
        }
        continue;
      }
      pendingEstimate += row?.contactCount ?? 0;
    }

    for (const id of campaignExcludedContactIds) ids.delete(id);
    return ids.size + pendingEstimate;
  }, [
    campaignRecipientMode,
    campaignSelectedContactIds,
    campaignSelectedGroupNames,
    groupMemberIdsByName,
    groupRows,
    campaignExcludedContactIds,
  ]);

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

  const effectiveEligibleAudience = useMemo((): CampaignEligibleAudienceFilter | null => {
    if (!campaignEligibleAudience) return null;
    if (campaignEligibleAudience.search !== contactsSearchQuery) return null;
    if (campaignSelectedGroupNames.length > 0) return null;
    return campaignEligibleAudience;
  }, [
    campaignEligibleAudience,
    contactsSearchQuery,
    campaignSelectedGroupNames.length,
  ]);

  const effectiveEligibleAudienceCount =
    effectiveEligibleAudience != null ? campaignEligibleAudienceCount : null;

  const recipientIdsKey = useMemo(() => {
    if (effectiveEligibleAudience) {
      return `audience\0${effectiveEligibleAudience.search}\0${[...campaignExcludedContactIds].sort().join("\0")}`;
    }
    return Array.from(recipientIdSet).sort().join("\0");
  }, [
    effectiveEligibleAudience,
    campaignExcludedContactIds,
    recipientIdSet,
  ]);

  /** Vide = pas de fetch contacts (étape < 3 ou mode numéros). */
  const contactsResolveKey = useMemo(() => {
    if (campaignRecipientMode === "numbers" || campaignWizardStep < 3) {
      return "";
    }
    return recipientIdsKey;
  }, [campaignRecipientMode, campaignWizardStep, recipientIdsKey]);

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

  // Contacts complets : étape 3 seulement (évite ~40 requêtes séquentielles au « Continuer » étape 1).
  useEffect(() => {
    let cancelled = false;
    const gen = ++contactsResolveGenRef.current;

    const run = async () => {
      if (!contactsResolveKey) {
        if (!cancelled && gen === contactsResolveGenRef.current) {
          setRecipientsResolving(false);
        }
        return;
      }

      const groupsPending = campaignSelectedGroupNames.some(
        (name) => groupMemberIdsByName[name] == null,
      );
      if (groupsPending) {
        if (campaignWizardStep >= 3) {
          setRecipientsResolving(true);
        }
        return;
      }

      const cached = resolvedContactsCacheRef.current;
      if (cached?.key === contactsResolveKey) {
        if (!cancelled && gen === contactsResolveGenRef.current) {
          startTransition(() => setResolvedRecipientContacts(cached.rows));
          setRecipientsResolving(false);
        }
        return;
      }

      setRecipientsResolving(true);

      if (effectiveEligibleAudience) {
        const { data, error } = await fetchClientsForCampaignRpc(supabase, {
          search: effectiveEligibleAudience.search,
          eligibleOnly: true,
          allEligible: true,
          excludeIds: campaignExcludedContactIds,
        });
        if (cancelled || gen !== contactsResolveGenRef.current) return;
        if (error) {
          resolvedContactsCacheRef.current = null;
          startTransition(() => setResolvedRecipientContacts([]));
          setRecipientsResolving(false);
          return;
        }
        resolvedContactsCacheRef.current = {
          key: contactsResolveKey,
          rows: data,
        };
        startTransition(() => setResolvedRecipientContacts(data));
        setRecipientsResolving(false);
        return;
      }

      const ids = contactsResolveKey.split("\0").filter(Boolean);
      if (ids.length === 0) {
        if (!cancelled && gen === contactsResolveGenRef.current) {
          resolvedContactsCacheRef.current = null;
          startTransition(() => setResolvedRecipientContacts([]));
          setRecipientsResolving(false);
        }
        return;
      }

      const { data, error } = await fetchClientsForCampaignRpc(supabase, {
        eligibleOnly: true,
        clientIds: ids,
      });
      if (cancelled || gen !== contactsResolveGenRef.current) return;
      if (error) {
        resolvedContactsCacheRef.current = null;
        startTransition(() => setResolvedRecipientContacts([]));
        setRecipientsResolving(false);
        return;
      }
      const byId = new Map(data.map((c) => [c.id, c]));
      const ordered = ids
        .map((id) => byId.get(id))
        .filter(Boolean) as ContactRowData[];
      resolvedContactsCacheRef.current = {
        key: contactsResolveKey,
        rows: ordered.length > 0 ? ordered : data,
      };
      startTransition(() =>
        setResolvedRecipientContacts(ordered.length > 0 ? ordered : data),
      );
      setRecipientsResolving(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    contactsResolveKey,
    campaignSelectedGroupNames,
    campaignWizardStep,
    effectiveEligibleAudience,
    campaignExcludedContactIds,
    groupMemberIdsByName,
    supabase,
  ]);

  const customFieldIdsKey = useMemo(
    () => customFieldDefs.map((d) => d.id).join("\0"),
    [customFieldDefs],
  );
  const excludeIdsKey = useMemo(
    () => [...campaignExcludedContactIds].sort().join("\0"),
    [campaignExcludedContactIds],
  );

  /** null = pas de RPC couverture (étape 1, numéros). */
  const mergeFillRequestKey = useMemo(() => {
    if (campaignRecipientMode === "numbers" || campaignWizardStep < 2) {
      return null;
    }
    if (effectiveEligibleAudience) {
      return `audience\0${effectiveEligibleAudience.search}\0${excludeIdsKey}\0${customFieldIdsKey}`;
    }
    if (campaignRecipientMode === "all") {
      return `all\0${excludeIdsKey}\0${customFieldIdsKey}`;
    }
    return `ids\0${recipientIdsKey}\0${customFieldIdsKey}`;
  }, [
    campaignRecipientMode,
    campaignWizardStep,
    effectiveEligibleAudience,
    excludeIdsKey,
    customFieldIdsKey,
    recipientIdsKey,
  ]);

  useEffect(() => {
    let cancelled = false;
    const gen = ++mergeFillGenRef.current;

    const run = async () => {
      if (mergeFillRequestKey === null) {
        if (!cancelled && gen === mergeFillGenRef.current) {
          setMergeFillCounts(EMPTY_MERGE_FILL_COUNTS);
          setMergeFillStatus(
            campaignRecipientMode === "numbers" ? "na" : "loading",
          );
        }
        return;
      }

      const groupsPending = campaignSelectedGroupNames.some(
        (name) => groupMemberIdsByName[name] == null,
      );
      if (campaignRecipientMode === "lists" && groupsPending) {
        setMergeFillStatus("loading");
        return;
      }

      setMergeFillStatus("loading");
      const customIds = customFieldIdsKey
        ? customFieldIdsKey.split("\0")
        : [];

      if (mergeFillRequestKey.startsWith("audience\0")) {
        const excludeIds = excludeIdsKey ? excludeIdsKey.split("\0") : [];
        const { data, error } = await fetchCampaignMergeFillCounts(supabase, {
          customIds,
          allEligible: true,
          excludeIds,
          search: effectiveEligibleAudience?.search ?? "",
        });
        if (cancelled || gen !== mergeFillGenRef.current) return;
        if (error) {
          setMergeFillCounts(EMPTY_MERGE_FILL_COUNTS);
          setMergeFillStatus("error");
          return;
        }
        setMergeFillCounts(data);
        setMergeFillStatus("ready");
        return;
      }

      if (mergeFillRequestKey.startsWith("all\0")) {
        const excludeIds = excludeIdsKey ? excludeIdsKey.split("\0") : [];
        const { data, error } = await fetchCampaignMergeFillCounts(supabase, {
          customIds,
          allEligible: true,
          excludeIds,
        });
        if (cancelled || gen !== mergeFillGenRef.current) return;
        if (error) {
          setMergeFillCounts(EMPTY_MERGE_FILL_COUNTS);
          setMergeFillStatus("error");
          return;
        }
        setMergeFillCounts(data);
        setMergeFillStatus("ready");
        return;
      }

      const ids = mergeFillRequestKey.startsWith("ids\0")
        ? recipientIdsKey.split("\0")
        : [];
      if (ids.length === 0) {
        if (!cancelled && gen === mergeFillGenRef.current) {
          setMergeFillCounts(EMPTY_MERGE_FILL_COUNTS);
          setMergeFillStatus("ready");
        }
        return;
      }

      const { data, error } = await fetchCampaignMergeFillCounts(supabase, {
        customIds,
        clientIds: ids,
      });
      if (cancelled || gen !== mergeFillGenRef.current) return;
      if (error) {
        setMergeFillCounts(EMPTY_MERGE_FILL_COUNTS);
        setMergeFillStatus("error");
        return;
      }
      setMergeFillCounts(data);
      setMergeFillStatus("ready");
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    mergeFillRequestKey,
    campaignRecipientMode,
    effectiveEligibleAudience,
    campaignSelectedGroupNames,
    customFieldIdsKey,
    excludeIdsKey,
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

  const resolvedEligibleCount = useMemo(
    () =>
      campaignSelectedContacts.filter(
        (c) => c.optIn && !c.stopSms && isValidFrMobile(c.phone),
      ).length,
    [campaignSelectedContacts],
  );

  const campaignRecipientCount = useMemo(() => {
    if (campaignRecipientMode === "numbers") {
      return campaignManualNumberStats.eligible;
    }
    if (
      effectiveEligibleAudience &&
      effectiveEligibleAudienceCount != null
    ) {
      return Math.max(
        0,
        effectiveEligibleAudienceCount - campaignExcludedContactIds.length,
      );
    }
    const idCount = recipientIdSet.size;
    const resolvedComplete =
      campaignSelectedContacts.length > 0 &&
      campaignSelectedContacts.length >= idCount;
    if (resolvedComplete) {
      return resolvedEligibleCount;
    }
    if (campaignRecipientMode === "lists" && listsRecipientCountEstimate != null) {
      return Math.max(listsRecipientCountEstimate, idCount);
    }
    return idCount;
  }, [
    campaignRecipientMode,
    campaignManualNumberStats,
    effectiveEligibleAudience,
    effectiveEligibleAudienceCount,
    campaignExcludedContactIds.length,
    campaignSelectedContacts.length,
    recipientIdSet,
    resolvedEligibleCount,
    listsRecipientCountEstimate,
  ]);

  const campaignRecipientSelectedRaw = useMemo(() => {
    if (campaignRecipientMode === "numbers") {
      return campaignManualNumberStats.raw;
    }
    if (
      effectiveEligibleAudience &&
      effectiveEligibleAudienceCount != null
    ) {
      return effectiveEligibleAudienceCount;
    }
    const idCount = recipientIdSet.size;
    const resolvedComplete =
      campaignSelectedContacts.length > 0 &&
      campaignSelectedContacts.length >= idCount;
    if (resolvedComplete) {
      return campaignSelectedContacts.length;
    }
    return idCount;
  }, [
    campaignRecipientMode,
    campaignManualNumberStats,
    effectiveEligibleAudience,
    effectiveEligibleAudienceCount,
    campaignSelectedContacts.length,
    recipientIdSet,
  ]);

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
    setCampaignEligibleAudience(null);
    setCampaignEligibleAudienceCount(null);
    resolvedContactsCacheRef.current = null;
    setResolvedRecipientContacts([]);
    setRecipientsResolving(false);
  }, [clearListSearches]);

  const setCampaignSelectedContactIdsFromGmail = useCallback(
    (value: SetStateAction<string[]>) => {
      setCampaignSelectedContactIds(value);
    },
    [],
  );

  const setCampaignSelectedContactIdsWrapped = useCallback(
    (value: SetStateAction<string[]>) => {
      setCampaignEligibleAudience(null);
      setCampaignEligibleAudienceCount(null);
      setCampaignSelectedContactIds(value);
    },
    [],
  );

  const fetchEligibleContactIdsForWizard = useCallback(
    async (search: string) => {
      const { data, error } = await listClientIdsRpc(supabase, {
        search,
        eligibleOnly: true,
      });
      if (error) return { data: [], error };
      if (
        data.length >= CAMPAIGN_AUDIENCE_FILTER_THRESHOLD &&
        campaignSelectedGroupNames.length === 0
      ) {
        setCampaignEligibleAudience({ search });
        setCampaignEligibleAudienceCount(data.length);
        setCampaignSelectedContactIds([]);
        return { data: [], error: null, usedServerFilter: true };
      }
      setCampaignEligibleAudience(null);
      setCampaignEligibleAudienceCount(null);
      return { data, error: null };
    },
    [supabase, campaignSelectedGroupNames.length],
  );

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
      setCampaignEligibleAudience(null);
      setCampaignEligibleAudienceCount(null);
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
    contactsTotalCount,
    groupsTotalCount,
    selectedGroupNames: campaignSelectedGroupNames,
    setSelectedGroupNames: setCampaignSelectedGroupNames,
    recipientMode: campaignRecipientMode,
    setRecipientMode: setCampaignRecipientMode,
    manualNumbers: campaignManualNumbers,
    setManualNumbers: setCampaignManualNumbers,
    selectedContactIds: campaignSelectedContactIds,
    setSelectedContactIds: setCampaignSelectedContactIdsWrapped,
    setSelectedContactIdsFromGmail: setCampaignSelectedContactIdsFromGmail,
    excludedContactIds: campaignExcludedContactIds,
    setExcludedContactIds: setCampaignExcludedContactIds,
    eligibleAudienceFilter: effectiveEligibleAudience,
    eligibleAudienceCount: effectiveEligibleAudienceCount,
    recipientSelectedRaw: campaignRecipientSelectedRaw,
    recipientExcludedStop: campaignExcludedStop,
    recipientExcludedInvalid: campaignExcludedInvalid,
    recipientCount: campaignRecipientCount,
    resolvedGroupMemberIds,
    groupMemberIdsByName,
    resolvedContacts: campaignSelectedContacts,
    recipientsResolving,
    mergeFillCounts,
    mergeFillStatus,
    onCountEligibleContacts: (search: string) =>
      countClientIds(supabase, { search, eligibleOnly: true }),
    onFetchEligibleContactIds: fetchEligibleContactIdsForWizard,
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
