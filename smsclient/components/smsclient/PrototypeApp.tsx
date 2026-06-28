"use client";

import { AppShell } from "@/components/smsclient/Shell";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AcheterCreditsView,
  AutomatisationsView,
  CampagnesView,
  ContactsView,
  GroupesView,
  ParametresView,
  LiensView,
  QrCodeView,
  ReglementationsSmsView,
  SoumettreAvisView,
  StatistiquesView,
} from "./MainViews";
import { CampaignWizard } from "@/components/smsclient/FlowViews";
import type { SmsComposeApproach } from "@/components/smsclient/CreateCampaign/SmsComposeApproachCards";
import { buildDefaultCampaignTitle } from "@/components/smsclient/CreateCampaign/campaignTextUtils";
import { CampaignWizardLeaveConfirmModal } from "@/components/smsclient/modals/CampaignWizardLeaveConfirmModal";
import { ImportContactsModal } from "./ImportContactsModal";
import {
  CampaignDetailsModal,
  ConfirmDeleteModal,
  ContactCreateModal,
  GroupModal,
  GroupQuickCreateModal,
} from "@/components/smsclient/PrototypeModals";
import { useAutomations } from "@/hooks/useAutomations";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useContacts } from "@/hooks/useContacts";
import { useCredits } from "@/hooks/useCredits";
import { useGroups } from "@/hooks/useGroups";
import { useLinks } from "@/hooks/useLinks";
import { useStatistics } from "@/hooks/useStatistics";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { profileToForm } from "@/lib/supabase/profile";
import { useProtoNavigation } from "@/hooks/useProtoNavigation";
import { useTrashItems } from "@/hooks/useTrashItems";
import { useQrWheel } from "@/hooks/useQrWheel";
import { useUserQrCode } from "@/hooks/useUserQrCode";
import { createClient } from "@/lib/supabase/client";
import {
  addClientsToGroupByName,
  deleteClients,
  insertClient,
  replaceGroupMembers,
  stampLastSmsOnContacts,
  updateClient,
} from "@/lib/supabase/clients";
import { insertSmsCampaign } from "@/lib/supabase/campaigns";
import {
  deleteGroups,
  insertClientGroup,
  updateClientGroup,
} from "@/lib/supabase/groups";
import { upsertAutomation } from "@/lib/supabase/automations";
import { restoreClients, restoreGroups } from "@/lib/supabase/trash";
import type { AutomationSavePayload } from "@/lib/types/automation";
import type { ContactFormSubmitPayload } from "@/lib/supabase/clients";
import type { GroupRowData } from "@/lib/types/group";
import type { CampaignRowData } from "@/lib/types/campaign";
import { type ContactRowData } from "@/lib/types/contact";
import {
  buildCampaignRecipientIdSet,
  SMS_PRENOM_TAG,
} from "@/lib/proto/smsPersonalization";
import { formatFrPhoneInput, isValidFrMobile } from "@/lib/proto/smsUtils";
import { parisLocalToISO, plusTenMinutesParis } from "@/lib/proto/timezone";
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
import {
  statsMonthRange,
  statsPeriodRange,
  type StatsPeriodPreset,
} from "@/lib/statsDateRanges";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
} from "react";

const DEFAULT_SMS = `🎉 ${SMS_PRENOM_TAG}, -20% aujourd'hui sur toute la boutique ! Offre valable jusqu'à 19h. Montrez ce SMS en caisse.`;

function plusTenMinutesLocalValue() {
  return plusTenMinutesParis();
}

function defaultCampaignTitle() {
  return `Campagne du ${new Date().toLocaleDateString("fr-FR")}`;
}

type CampaignComposerPreset =
  | string
  | { contactIds?: string[]; groupNames?: string[] };

type PendingWizardLeaveAction =
  | { type: "navigate"; path: string }
  | { type: "open"; preset?: CampaignComposerPreset };

function parseManualNumbers(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function PrototypeApp() {
  const { route, go } = useProtoNavigation();
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const {
    rows: contacts,
    loading: contactsLoading,
    error: contactsError,
    refresh: refreshContacts,
  } = useContacts();

  const {
    rows: groupRows,
    loading: groupsLoading,
    error: groupsError,
    refresh: refreshGroups,
  } = useGroups();

  const {
    rows: campaignRows,
    loading: campaignsLoading,
    error: campaignsError,
    refresh: refreshCampaigns,
  } = useCampaigns();

  const {
    rows: linkRows,
    loading: linksLoading,
    error: linksError,
    refresh: refreshLinks,
    supabase: linksSupabase,
    userId: linksUserId,
  } = useLinks();

  const automationsEnabled = route === "automatisations";
  const {
    rows: automationRows,
    loading: automationsLoading,
    error: automationsError,
    refresh: refreshAutomations,
  } = useAutomations(automationsEnabled);

  const {
    balance: creditsBalance,
    balanceLabel: creditsBalanceLabel,
    purchases: creditPurchases,
    loading: creditsLoading,
    error: creditsError,
    buy: buyCredits,
  } = useCredits();

  const {
    profile,
    loading: profileLoading,
    saveProfile,
    smsSender,
    setSmsSender,
  } = useUserProfile();
  const {
    publicUrl: userQrPublicUrl,
    captureMode: userQrCaptureMode,
    welcomeSmsTemplate: userQrWelcomeSmsTemplate,
    loading: userQrLoading,
    error: userQrError,
    setCaptureMode: setUserQrCaptureMode,
    setWelcomeSmsTemplate: setUserQrWelcomeSmsTemplate,
  } = useUserQrCode();

  const qrWheelEnabled = route === "qr-boutique";
  const {
    config: qrWheelConfig,
    loading: qrWheelLoading,
    saveAll: saveQrWheel,
    enableWithDefaults: enableQrWheelDefaults,
    patchEnabled: patchQrWheelEnabled,
  } = useQrWheel(qrWheelEnabled);

  const [qrWheelSaving, setQrWheelSaving] = useState(false);

  const trashEnabled = route === "parametres";
  const {
    contacts: trashContacts,
    groups: trashGroups,
    loading: trashLoading,
    error: trashError,
    refresh: refreshTrash,
  } = useTrashItems(supabase, user?.id, trashEnabled);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupQuickFromContactOpen, setGroupQuickFromContactOpen] =
    useState(false);
  const [groupEditOpen, setGroupEditOpen] = useState(false);
  const [groupEditRow, setGroupEditRow] = useState<GroupRowData | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactModalMode, setContactModalMode] = useState<"add" | "edit">(
    "add"
  );
  const [contactEditRow, setContactEditRow] = useState<ContactRowData | null>(
    null
  );
  const [importContactsOpen, setImportContactsOpen] = useState(false);
  const [campaignDetailsOpen, setCampaignDetailsOpen] = useState(false);
  const [campaignDetailsRow, setCampaignDetailsRow] =
    useState<CampaignRowData | null>(null);

  const [cmFirst, setCmFirst] = useState("");
  const [cmLast, setCmLast] = useState("");
  const [cmPhone, setCmPhone] = useState("");
  const [cmBirthday, setCmBirthday] = useState("");
  const [cmNotes, setCmNotes] = useState("");
  const [cmGroups, setCmGroups] = useState<string[]>([]);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteTitle, setConfirmDeleteTitle] = useState("");
  const [confirmDeleteDesc, setConfirmDeleteDesc] = useState("");
  const [confirmDeleteAction, setConfirmDeleteAction] = useState<
    (() => Promise<void>) | null
  >(null);

  const groupOptions = useMemo(() => {
    const fromDb = groupRows.map((g) => g.name);
    const fromContacts = [...new Set(contacts.flatMap((c) => c.groups))];
    return [...new Set([...fromDb, ...fromContacts])];
  }, [contacts, groupRows]);

  const groupModalContacts = useMemo(
    () =>
      contacts.map((c) => ({
        id: c.id,
        name: c.name,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        groups: c.groups,
      })),
    [contacts]
  );

  const unsubscribedContacts = useMemo(
    () =>
      contacts
        .filter((c) => c.stopSms)
        .map((c) => ({
          name: c.name,
          phone: c.phone,
          date: c.unsubscribed !== "—" ? c.unsubscribed : c.created,
        })),
    [contacts]
  );

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
  const campaignCreditsAvailable = creditsBalance;

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
    return {
      raw: numbers.length,
      stop: 0,
      invalid,
      eligible,
    };
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
  const initialWizardSnapshotRef = useRef<CampaignWizardFormSnapshot | null>(
    null,
  );
  const pendingWizardLeaveActionRef = useRef<PendingWizardLeaveAction | null>(
    null,
  );
  const wizardGuardRanRef = useRef(false);

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
    ],
  );

  const wizardIsDirty = useMemo(() => {
    if (route !== "nouvelle-campagne" || !initialWizardSnapshotRef.current) {
      return false;
    }
    return isCampaignWizardDirty(
      buildCurrentWizardSnapshot(),
      initialWizardSnapshotRef.current,
    );
  }, [route, buildCurrentWizardSnapshot]);

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

      initialWizardSnapshotRef.current = {
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
      };

      go("nouvelle-campagne");
    },
    [go, smsSender],
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
    [wizardIsDirty, handleWizardExit, go],
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
    [route, wizardIsDirty, go],
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

  useEffect(() => {
    if (route !== "nouvelle-campagne") {
      initialWizardSnapshotRef.current = null;
      return;
    }
    if (!initialWizardSnapshotRef.current) {
      initialWizardSnapshotRef.current = buildCurrentWizardSnapshot();
    }
  }, [route, buildCurrentWizardSnapshot]);

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

  const { from: mFrom, to: mTo } = useMemo(() => statsMonthRange(), []);
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriodPreset>("month");
  const [statsOpen, setStatsOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState(mFrom);
  const [dateTo, setDateTo] = useState(mTo);
  const [appliedStatsFrom, setAppliedStatsFrom] = useState(mFrom);
  const [appliedStatsTo, setAppliedStatsTo] = useState(mTo);
  const {
    data: statisticsData,
    loading: statisticsLoading,
    error: statisticsError,
  } = useStatistics({
    from: appliedStatsFrom,
    to: appliedStatsTo,
  });

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const anyModal =
      groupModalOpen ||
      groupQuickFromContactOpen ||
      groupEditOpen ||
      contactModalOpen ||
      importContactsOpen;
    document.body.style.overflow = anyModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [
    groupModalOpen,
    groupQuickFromContactOpen,
    groupEditOpen,
    contactModalOpen,
    importContactsOpen,
  ]);

  useEffect(() => {
    startTransition(() => {
      if (route !== "statistiques") setStatsOpen(false);
    });
  }, [route]);

  const openContactAdd = useCallback(() => {
    setContactModalMode("add");
    setContactEditRow(null);
    setCmFirst("");
    setCmLast("");
    setCmPhone("");
    setCmBirthday("");
    setCmNotes("");
    setCmGroups([]);
    setContactModalOpen(true);
  }, []);

  const openContactEdit = useCallback((row: ContactRowData) => {
    setContactModalMode("edit");
    setContactEditRow(row);
    setCmFirst(row.firstName);
    setCmLast(row.lastName);
    setCmPhone(formatFrPhoneInput(row.phone));
    setCmBirthday(row.birthday);
    setCmNotes(row.notes);
    setCmGroups([...row.groups]);
    setContactModalOpen(true);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, []);

  const openConfirmDelete = useCallback(
    (title: string, desc: string, action: () => Promise<void>) => {
      setConfirmDeleteTitle(title);
      setConfirmDeleteDesc(desc);
      setConfirmDeleteAction(() => action);
      setConfirmDeleteOpen(true);
    },
    []
  );

  const handleDeleteContacts = useCallback(
    (ids: string[]) => {
      const n = ids.length;
      openConfirmDelete(
        `Supprimer ${n} contact${n > 1 ? "s" : ""} ?`,
        `${
          n > 1 ? "Les contacts sélectionnés seront" : "Le contact sera"
        } retiré${n > 1 ? "s" : ""} de tes listes. Tu pourras ${
          n > 1 ? "les" : "le"
        } restaurer dans Paramètres → Éléments supprimés.`,
        async () => {
          const { error } = await deleteClients(supabase, ids);
          if (error) throw error;
          setConfirmDeleteOpen(false);
          refreshContacts();
          void refreshTrash();
          showToast(
            `${n} contact${n > 1 ? "s" : ""} supprimé${n > 1 ? "s" : ""}.`
          );
        }
      );
    },
    [openConfirmDelete, supabase, refreshContacts, refreshTrash, showToast]
  );

  const handleDeleteContactFromModal = useCallback(() => {
    if (!contactEditRow) return;
    setContactModalOpen(false);
    handleDeleteContacts([contactEditRow.id]);
  }, [contactEditRow, handleDeleteContacts]);

  const handleDeleteGroups = useCallback(
    (ids: string[]) => {
      const n = ids.length;
      openConfirmDelete(
        `Supprimer ${n} groupe${n > 1 ? "s" : ""} ?`,
        `${
          n > 1 ? "Les groupes sélectionnés seront" : "Le groupe sera"
        } retiré${
          n > 1 ? "s" : ""
        } de tes listes. Les contacts ne sont pas supprimés. Restauration possible dans Paramètres → Éléments supprimés.`,
        async () => {
          const { error } = await deleteGroups(supabase, ids);
          if (error) throw error;
          setConfirmDeleteOpen(false);
          refreshGroups();
          void refreshTrash();
          showToast(
            `${n} groupe${n > 1 ? "s" : ""} supprimé${n > 1 ? "s" : ""}.`
          );
        }
      );
    },
    [openConfirmDelete, supabase, refreshGroups, refreshTrash, showToast]
  );

  const handleDeleteGroupFromModal = useCallback(() => {
    if (!groupEditRow) return;
    const id = groupEditRow.id;
    const groupName = groupEditRow.name;
    openConfirmDelete(
      "Supprimer ce groupe ?",
      `Le groupe « ${groupName} » sera retiré de tes listes. Les contacts ne sont pas supprimés. Tu pourras le restaurer dans Paramètres → Éléments supprimés.`,
      async () => {
        const { error } = await deleteGroups(supabase, [id]);
        if (error) throw error;
        setConfirmDeleteOpen(false);
        setGroupEditOpen(false);
        setGroupEditRow(null);
        refreshGroups();
        void refreshTrash();
        showToast("Groupe supprimé.");
      }
    );
  }, [
    groupEditRow,
    openConfirmDelete,
    supabase,
    refreshGroups,
    refreshTrash,
    showToast,
  ]);

  const handleRestoreTrashContacts = useCallback(
    async (ids: string[]) => {
      if (!user?.id) throw new Error("Tu dois être connecté.");
      const { restored, error } = await restoreClients(supabase, user.id, ids);
      if (error) throw error;
      refreshContacts();
      showToast(
        `${restored} contact${restored > 1 ? "s" : ""} restauré${
          restored > 1 ? "s" : ""
        }.`
      );
    },
    [supabase, user?.id, refreshContacts, showToast]
  );

  const handleRestoreTrashGroups = useCallback(
    async (ids: string[]) => {
      if (!user?.id) throw new Error("Tu dois être connecté.");
      const { restored, error } = await restoreGroups(supabase, user.id, ids);
      if (error) throw error;
      refreshGroups();
      showToast(
        `${restored} groupe${restored > 1 ? "s" : ""} restauré${
          restored > 1 ? "s" : ""
        }.`
      );
    },
    [supabase, user?.id, refreshGroups, showToast]
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
    [route, wizardIsDirty, openCampaignComposerInternal],
  );

  const handleUnsubscribeContact = useCallback(async () => {
    if (!user?.id || !contactEditRow) {
      throw new Error("Tu dois être connecté pour désabonner un contact.");
    }
    const { error } = await updateClient(supabase, user.id, contactEditRow.id, {
      firstName: cmFirst.trim() || contactEditRow.firstName,
      lastName: cmLast.trim() || contactEditRow.lastName,
      phoneDisplay: cmPhone,
      groupLabels: cmGroups,
      birthday: cmBirthday,
      notes: cmNotes,
      optIn: false,
      stop: true,
    });
    if (error) throw error;
    await refreshContacts();
    showToast("Contact désabonné.");
  }, [
    user?.id,
    contactEditRow,
    supabase,
    cmFirst,
    cmLast,
    cmPhone,
    cmGroups,
    cmBirthday,
    cmNotes,
    refreshContacts,
    showToast,
  ]);

  const handleAutomationSave = useCallback(
    async (payload: AutomationSavePayload) => {
      if (!user?.id) {
        throw new Error(
          "Tu dois être connecté pour enregistrer une automatisation."
        );
      }
      const { error } = await upsertAutomation(supabase, user.id, payload);
      if (error) throw error;
      await refreshAutomations();
      showToast(
        payload.enabled
          ? "Automatisation activée."
          : "Automatisation enregistrée."
      );
    },
    [user?.id, supabase, refreshAutomations, showToast]
  );

  const handleContactSave = useCallback(
    async (payload: ContactFormSubmitPayload) => {
      if (!user?.id) {
        throw new Error("Tu dois être connecté pour enregistrer un contact.");
      }
      if (contactModalMode === "edit" && contactEditRow) {
        const { error } = await updateClient(
          supabase,
          user.id,
          contactEditRow.id,
          payload
        );
        if (error) throw error;
      } else {
        const { error } = await insertClient(supabase, user.id, payload);
        if (error) throw error;
      }
      await refreshContacts();
      showToast("Contact enregistré");
    },
    [
      user,
      supabase,
      contactModalMode,
      contactEditRow,
      refreshContacts,
      showToast,
    ]
  );

  const applyStatsPreset = useCallback(
    (preset: Exclude<StatsPeriodPreset, "custom">) => {
      const { from, to } = statsPeriodRange(preset);
      setDateFrom(from);
      setDateTo(to);
      setAppliedStatsFrom(from);
      setAppliedStatsTo(to);
      setStatsPeriod(preset);
      setStatsOpen(false);
    },
    []
  );

  const applyStatsRange = useCallback(() => {
    setAppliedStatsFrom(dateFrom);
    setAppliedStatsTo(dateTo);
    setStatsPeriod("custom");
    setStatsOpen(false);
  }, [dateFrom, dateTo]);

  const handleCampaignConfirm = useCallback(async () => {
    if (!user?.id) {
      throw new Error("Tu dois être connecté pour enregistrer une campagne.");
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

    const { error } = await insertSmsCampaign(supabase, user.id, {
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
    await refreshCampaigns();
    await refreshContacts();
    showToast("Campagne enregistrée");
  }, [
    user,
    supabase,
    campaignTitle,
    campaignSender,
    smsBody,
    sendMode,
    scheduledAt,
    campaignRecipientCount,
    campaignRecipientMode,
    campaignSelectedContacts,
    refreshCampaigns,
    refreshContacts,
    showToast,
  ]);

  const preselectGroupOnContactForm = useCallback((groupName: string) => {
    const trimmed = groupName.trim();
    if (!trimmed) return;
    setCmGroups((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  }, []);

  const onGroupCreatedFromModal = useCallback(
    async (name: string, desc: string, selectedContactIds: string[]) => {
      if (!user?.id) {
        throw new Error("Tu dois être connecté pour créer un groupe.");
      }
      const trimmed = name.trim();
      const { error } = await insertClientGroup(supabase, user.id, name, desc);
      if (error) throw error;
      if (selectedContactIds.length > 0) {
        const assign = await addClientsToGroupByName(
          supabase,
          user.id,
          selectedContactIds,
          trimmed
        );
        if (assign.error) throw assign.error;
      }
      await refreshGroups();
      await refreshContacts();
      if (contactModalOpen) {
        preselectGroupOnContactForm(trimmed);
      }
      showToast(
        selectedContactIds.length > 0
          ? `Groupe créé · ${selectedContactIds.length} contact${
              selectedContactIds.length > 1 ? "s" : ""
            } rattaché${selectedContactIds.length > 1 ? "s" : ""}`
          : "Groupe créé"
      );
    },
    [
      user,
      supabase,
      refreshGroups,
      refreshContacts,
      contactModalOpen,
      preselectGroupOnContactForm,
      showToast,
    ]
  );

  const onGroupQuickCreatedFromContact = useCallback(
    async (name: string, desc: string) => {
      if (!user?.id) {
        throw new Error("Tu dois être connecté pour créer un groupe.");
      }
      const trimmed = name.trim();
      const { error } = await insertClientGroup(
        supabase,
        user.id,
        trimmed,
        desc
      );
      if (error) throw error;
      await refreshGroups();
      preselectGroupOnContactForm(trimmed);
      showToast("Groupe créé");
    },
    [user, supabase, refreshGroups, preselectGroupOnContactForm, showToast]
  );

  const openGroupEdit = useCallback((row: GroupRowData) => {
    setGroupEditRow(row);
    setGroupEditOpen(true);
  }, []);

  const handleGroupUpdate = useCallback(
    async (payload: {
      id: string;
      name: string;
      description: string;
      selectedContactIds: string[];
    }) => {
      if (!user?.id) {
        throw new Error("Tu dois être connecté pour modifier un groupe.");
      }
      const { error } = await updateClientGroup(supabase, user.id, payload.id, {
        name: payload.name,
        description: payload.description,
      });
      if (error) throw error;
      const { error: memErr } = await replaceGroupMembers(
        supabase,
        user.id,
        payload.id,
        payload.selectedContactIds
      );
      if (memErr) throw memErr;
      await refreshGroups();
      await refreshContacts();
      showToast("Groupe modifié");
    },
    [user, supabase, refreshGroups, refreshContacts, showToast]
  );

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
    creditsAvailable: campaignCreditsAvailable,
    onConfirmCampaign: handleCampaignConfirm,
  } as const;

  const renderRoute = (r: AppRoute) => {
    switch (r) {
      case "contacts":
        return (
          <ContactsView
            rows={contacts}
            loading={contactsLoading}
            error={contactsError}
            onImport={() => setImportContactsOpen(true)}
            onAddContact={openContactAdd}
            onRowClick={openContactEdit}
            onDeleteContacts={handleDeleteContacts}
            onCreateCampaignFromContacts={(ids) =>
              openCampaignComposer({ contactIds: ids })
            }
          />
        );
      case "groupes":
        return (
          <GroupesView
            rows={groupRows}
            loading={groupsLoading}
            error={groupsError}
            onCreateGroup={() => setGroupModalOpen(true)}
            onEditGroup={openGroupEdit}
            onDeleteGroups={handleDeleteGroups}
            onCreateCampaignFromGroups={(ids) => {
              const names = groupRows
                .filter((g) => ids.includes(g.id))
                .map((g) => g.name);
              openCampaignComposer({ groupNames: names });
            }}
          />
        );
      case "campagnes":
        return (
          <CampagnesView
            rows={campaignRows}
            loading={campaignsLoading}
            error={campaignsError}
            onNewCampaign={() => openCampaignComposer()}
            onOpenDetails={(row) => {
              setCampaignDetailsRow(row);
              setCampaignDetailsOpen(true);
            }}
          />
        );
      case "automatisations":
        return (
          <AutomatisationsView
            rows={automationRows}
            contacts={contacts}
            loading={automationsLoading}
            error={automationsError}
            onSave={handleAutomationSave}
          />
        );
      case "statistiques":
        return (
          <StatistiquesView
            statsPeriod={statsPeriod}
            appliedDateFrom={appliedStatsFrom}
            appliedDateTo={appliedStatsTo}
            onSelectPeriod={applyStatsPreset}
            statsOpen={statsOpen}
            setStatsOpen={setStatsOpen}
            dateFrom={dateFrom}
            dateTo={dateTo}
            setDateFrom={setDateFrom}
            setDateTo={setDateTo}
            applyRange={applyStatsRange}
            loading={statisticsLoading}
            error={statisticsError}
            data={statisticsData}
            onExport={() =>
              showToast("Export des statistiques (à implémenter).")
            }
            unsubscribedContacts={unsubscribedContacts}
          />
        );
      case "liens":
        return (
          <LiensView
            rows={linkRows}
            loading={linksLoading}
            error={linksError}
            supabase={linksSupabase}
            userId={linksUserId}
            onRefresh={refreshLinks}
            onToast={showToast}
          />
        );
      case "reglementations-sms":
        return <ReglementationsSmsView />;
      case "soumettre-avis":
        return <SoumettreAvisView onToast={showToast} />;
      case "qr-boutique":
        return (
          <QrCodeView
            publicUrl={userQrPublicUrl}
            loading={userQrLoading}
            error={userQrError}
            companyName={profile?.companyName}
            captureMode={userQrCaptureMode}
            onCaptureModeChange={async (mode) => {
              if (mode === "wheel") {
                patchQrWheelEnabled(true);
              } else {
                patchQrWheelEnabled(false);
              }
              try {
                await setUserQrCaptureMode(mode);
                if (
                  mode === "wheel" &&
                  (qrWheelConfig?.segments.length ?? 0) === 0
                ) {
                  await enableQrWheelDefaults();
                }
              } catch {
                /* rollback optimiste géré par useUserQrCode */
              }
            }}
            welcomeSmsTemplate={userQrWelcomeSmsTemplate}
            onWelcomeSmsTemplateChange={setUserQrWelcomeSmsTemplate}
            wheelConfig={qrWheelConfig}
            wheelLoading={qrWheelLoading}
            wheelSaving={qrWheelSaving}
            onWheelSave={async (config) => {
              setQrWheelSaving(true);
              try {
                await saveQrWheel(config);
              } finally {
                setQrWheelSaving(false);
              }
            }}
            onWheelEnableDefaults={async () => {
              setQrWheelSaving(true);
              try {
                await enableQrWheelDefaults();
              } finally {
                setQrWheelSaving(false);
              }
            }}
          />
        );
      case "parametres":
        return (
          <ParametresView
            profileForm={profile ? profileToForm(profile) : null}
            profileLoading={profileLoading}
            onSaveProfile={saveProfile}
            purchases={creditPurchases}
            purchasesLoading={creditsLoading}
            onInvoiceClick={(id: string) =>
              showToast(`Téléchargement de la facture ${id} (prototype)`)
            }
            trashContacts={trashContacts}
            trashGroups={trashGroups}
            trashLoading={trashLoading}
            trashError={trashError}
            onRestoreTrashContacts={handleRestoreTrashContacts}
            onRestoreTrashGroups={handleRestoreTrashGroups}
            onRefreshTrash={refreshTrash}
          />
        );
      case "acheter-credits":
        return (
          <AcheterCreditsView
            balanceLabel={creditsBalanceLabel}
            creditsAvailable={campaignCreditsAvailable}
            onCancel={() => go("campagnes")}
            onBuy={async (selection) => {
              if (!user?.id) {
                throw new Error(
                  "Tu dois être connecté pour acheter des crédits."
                );
              }
              const { invoiceRef, error } = await buyCredits({
                packCode: selection.code,
                packLabel: selection.pack,
                credits: selection.credits,
                amountEur:
                  Math.round(
                    (selection.priceHT + selection.priceHT * 0.2) * 100
                  ) / 100,
              });
              if (error) throw error;
              showToast(
                `Achat confirmé (${new Intl.NumberFormat("fr-FR").format(
                  selection.credits
                )} crédits)${invoiceRef ? ` · ${invoiceRef}` : ""}`
              );
            }}
          />
        );
      case "nouvelle-campagne":
        return <CampaignWizard {...campaignWizardProps} />;
      default:
        return (
          <ContactsView
            rows={contacts}
            loading={contactsLoading}
            error={contactsError}
            onImport={() => setImportContactsOpen(true)}
            onAddContact={openContactAdd}
            onRowClick={openContactEdit}
            onDeleteContacts={handleDeleteContacts}
            onCreateCampaignFromContacts={(ids) =>
              openCampaignComposer({ contactIds: ids })
            }
          />
        );
    }
  };

  return (
    <>
      <AppShell
        route={route}
        go={guardedGo}
        onNewCampaign={() => openCampaignComposer()}
        creditsLabel={creditsLoading ? "…" : creditsBalanceLabel}
        onBuyCredits={() => guardedGo("acheter-credits")}
        campaignWizardStep={
          route === "nouvelle-campagne" ? campaignWizardStep : undefined
        }
      >
        {renderRoute(route)}
      </AppShell>

      <GroupModal
        mode="create"
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        contacts={groupModalContacts}
        contactsLoading={contactsLoading}
        onCreated={onGroupCreatedFromModal}
      />
      <GroupModal
        mode="edit"
        open={groupEditOpen}
        group={groupEditRow}
        contacts={groupModalContacts}
        contactsLoading={contactsLoading}
        stackedDialogOpen={confirmDeleteOpen}
        onClose={() => {
          setGroupEditOpen(false);
          setGroupEditRow(null);
        }}
        onSave={handleGroupUpdate}
        onLaunchCampaign={(groupName) => {
          setGroupEditOpen(false);
          setGroupEditRow(null);
          openCampaignComposer(groupName);
        }}
        onDeleteGroup={handleDeleteGroupFromModal}
      />

      <ContactCreateModal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        mode={contactModalMode}
        first={cmFirst}
        setFirst={setCmFirst}
        last={cmLast}
        setLast={setCmLast}
        phone={cmPhone}
        setPhone={setCmPhone}
        birthday={cmBirthday}
        setBirthday={setCmBirthday}
        notes={cmNotes}
        setNotes={setCmNotes}
        groups={cmGroups}
        setGroups={setCmGroups}
        groupOptions={groupOptions}
        onCreateGroupRequest={() => setGroupQuickFromContactOpen(true)}
        consentDefaults={
          contactEditRow
            ? { optIn: contactEditRow.optIn, stop: contactEditRow.stopSms }
            : null
        }
        onSaveContact={handleContactSave}
        onDeleteContact={
          contactModalMode === "edit" ? handleDeleteContactFromModal : undefined
        }
        onUnsubscribeContact={
          contactModalMode === "edit" ? handleUnsubscribeContact : undefined
        }
      />

      <GroupQuickCreateModal
        open={groupQuickFromContactOpen}
        onClose={() => setGroupQuickFromContactOpen(false)}
        onCreated={onGroupQuickCreatedFromContact}
      />

      <CampaignDetailsModal
        open={campaignDetailsOpen}
        campaign={campaignDetailsRow}
        onClose={() => {
          setCampaignDetailsOpen(false);
          setCampaignDetailsRow(null);
        }}
      />

      {user?.id && (
        <ImportContactsModal
          open={importContactsOpen}
          onClose={() => setImportContactsOpen(false)}
          supabase={supabase}
          userId={user.id}
          onImported={refreshContacts}
          onNotify={showToast}
        />
      )}

      <ConfirmDeleteModal
        open={confirmDeleteOpen}
        title={confirmDeleteTitle}
        description={confirmDeleteDesc}
        stacked={confirmDeleteOpen && (groupEditOpen || contactModalOpen)}
        onConfirm={confirmDeleteAction ?? (async () => {})}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      <CampaignWizardLeaveConfirmModal
        open={leaveWizardConfirmOpen}
        onStay={() => {
          pendingWizardLeaveActionRef.current = null;
          setLeaveWizardConfirmOpen(false);
        }}
        onLeave={confirmWizardLeave}
      />

      {toast && (
        <div
          className="fixed bottom-[18px] right-[18px] z-[10000] rounded-2xl bg-slate-900 px-3.5 py-3 text-sm font-extrabold text-white shadow-[0_18px_40px_rgba(15,23,42,0.35)]"
          role="status"
        >
          {toast}
        </div>
      )}
    </>
  );
}
