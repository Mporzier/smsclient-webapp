"use client";

import { buildDefaultCampaignTitle } from "@/components/smsclient/CreateCampaign/campaignTextUtils";
import type { SmsComposeApproach } from "@/components/smsclient/CreateCampaign/SmsComposeApproachCards";
import { insertSmsCampaign } from "@/lib/supabase/campaigns";
import {
  stampLastSmsOnContacts,
} from "@/lib/supabase/clients";
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
  contactsLoading: boolean;
  creditsBalance: number;
  supabase: SupabaseClient;
  userId: string | undefined;
  onCampaignSaved: () => Promise<void>;
  showToast: (msg: string) => void;
};

export function useCampaignWizard({
  route,
  go,
  smsSender,
  contacts,
  groupRows,
  groupsLoading,
  contactsLoading,
  creditsBalance,
  supabase,
  userId,
  onCampaignSaved,
  showToast,
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

  const campaignSelectedContacts = useMemo(() => {
    const ids = buildCampaignRecipientIdSet({
      contacts,
      recipientMode: campaignRecipientMode,
      selectedContactIds: campaignSelectedContactIds,
      selectedGroupNames: campaignSelectedGroupNames,
      excludedContactIds: campaignExcludedContactIds,
    });
    return contacts.filter((c) => ids.has(c.id));
  }, [
    contacts,
    campaignRecipientMode,
    campaignSelectedContactIds,
    campaignSelectedGroupNames,
    campaignExcludedContactIds,
  ]);

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

  const handleWizardExit = useCallback(() => {
    clearCampaignWizardSession();
    setCampaignWizardStep(1);
    setCampaignComposeApproach(null);
  }, []);

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
      let recipientMode: "manual" | "lists" = "manual";
      let contactIds: string[] = [];
      let groupNames: string[] = [];

      if (typeof preset === "string") {
        const name = preset.trim();
        if (name) {
          recipientMode = "lists";
          groupNames = [name];
        }
      } else if (preset?.groupNames?.length) {
        recipientMode = "lists";
        groupNames = preset.groupNames;
      } else if (preset?.contactIds?.length) {
        recipientMode = "manual";
        contactIds = preset.contactIds;
      }

      const nextTitle = defaultCampaignTitle();
      const nextScheduleAt = plusTenMinutesLocalValue();

      setCampaignRecipientMode(recipientMode);
      setCampaignTitle(nextTitle);
      setCampaignSender(smsSender);
      setSmsBody("");
      setSendMode("now");
      setScheduledAt(nextScheduleAt);
      setAiOpen(false);
      setCampaignSelectedContactIds(contactIds);
      setCampaignExcludedContactIds([]);
      setCampaignSelectedGroupNames(groupNames);
      setCampaignManualNumbers("");
      setCampaignComposeApproach(null);
      setCampaignWizardStep(1);
      setStoredCampaignWizardStep(1);

      setInitialWizardSnapshot({
        step: 1,
        title: nextTitle,
        sender: smsSender,
        sms: "",
        sendMode: "now",
        scheduleAt: nextScheduleAt,
        recipientMode,
        manualNumbers: "",
        selectedContactIds: contactIds,
        selectedGroupNames: groupNames,
        excludedContactIds: [],
        composeApproach: null,
      });

      go("nouvelle-campagne");
    },
    [go, smsSender]
  );

  const confirmWizardLeave = useCallback(() => {
    setLeaveWizardConfirmOpen(false);
    handleWizardExit();
    const action = pendingWizardLeaveActionRef.current;
    pendingWizardLeaveActionRef.current = null;
    if (!action) return;
    if (action.type === "navigate") {
      go(action.path);
      return;
    }
    openCampaignComposerInternal(action.preset);
  }, [go, handleWizardExit, openCampaignComposerInternal]);

  const requestWizardLeave = useCallback(
    (path = "campagnes") => {
      if (!wizardIsDirty) {
        handleWizardExit();
        go(path);
        return;
      }
      pendingWizardLeaveActionRef.current = { type: "navigate", path };
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
    showToast("Campagne enregistrée");
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
    showToast,
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
    contacts,
    contactsLoading,
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
