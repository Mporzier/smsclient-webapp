"use client";

import { AppShell } from "@/components/smsclient/Shell";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AcheterCreditsView,
  CampagnesView,
  ContactsView,
  GroupesView,
  ParametresView,
  StatistiquesView,
} from "./MainViews";
import { CampaignWizard } from "@/components/smsclient/FlowViews";
import { ImportContactsModal } from "./ImportContactsModal";
import {
  CampaignDetailsModal,
  ConfirmDeleteModal,
  ContactCreateModal,
  GroupEditModal,
  GroupCreateModal,
} from "@/components/smsclient/PrototypeModals";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useContacts } from "@/hooks/useContacts";
import { useCredits } from "@/hooks/useCredits";
import { useGroups } from "@/hooks/useGroups";
import { useStatistics } from "@/hooks/useStatistics";
import { usePersistedSmsSender } from "@/hooks/usePersistedSmsSender";
import { useProtoNavigation } from "@/hooks/useProtoNavigation";
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
import { deleteGroups, insertClientGroup, updateClientGroup } from "@/lib/supabase/groups";
import type { ContactFormSubmitPayload } from "@/lib/supabase/clients";
import type { GroupRowData } from "@/lib/types/group";
import type { CampaignRowData } from "@/lib/types/campaign";
import { type ContactRowData } from "@/lib/types/contact";
import { isValidFrMobile } from "@/lib/proto/smsUtils";
import { parisLocalToISO, plusTenMinutesParis } from "@/lib/proto/timezone";
import type { AppRoute } from "@/lib/proto/routes";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const DEFAULT_SMS =
  "🎉 {PRENOM}, -20% aujourd'hui sur toute la boutique ! Offre valable jusqu'à 19h. Montrez ce SMS en caisse.";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function monthRangeStrings() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  return {
    from: `${y}-${pad(m + 1)}-${pad(first.getDate())}`,
    to: `${y}-${pad(m + 1)}-${pad(last.getDate())}`,
  };
}

function fmtFr(iso: string) {
  const [yy, mm, dd] = iso.split("-");
  return `${dd}/${mm}/${yy}`;
}

function plusTenMinutesLocalValue() {
  return plusTenMinutesParis();
}

function defaultCampaignTitle() {
  return `Campagne · ${new Date().toLocaleDateString("fr-FR")}`;
}

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
    balance: creditsBalance,
    balanceLabel: creditsBalanceLabel,
    purchases: creditPurchases,
    loading: creditsLoading,
    error: creditsError,
    buy: buyCredits,
  } = useCredits();

  const { sender: smsSender, setSender: setSmsSender } =
    usePersistedSmsSender();
  const {
    publicUrl: userQrPublicUrl,
    loading: userQrLoading,
    error: userQrError,
    regenerate: regenerateUserQr,
  } = useUserQrCode();


  const [groupModalOpen, setGroupModalOpen] = useState(false);
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
  const [cmNotes, setCmNotes] = useState("");
  const [cmGroups, setCmGroups] = useState<string[]>([]);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteTitle, setConfirmDeleteTitle] = useState("");
  const [confirmDeleteDesc, setConfirmDeleteDesc] = useState("");
  const [confirmDeleteAction, setConfirmDeleteAction] = useState<(() => Promise<void>) | null>(null);

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
          date: c.lastSms !== "—" ? c.lastSms : c.created,
        })),
    [contacts],
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
  const [campaignManualNumbers, setCampaignManualNumbers] = useState("");
  const campaignCreditsAvailable = creditsBalance;

  const campaignSelectedContacts = useMemo(() => {
    if (campaignRecipientMode === "all") {
      return contacts;
    }
    if (campaignRecipientMode === "manual") {
      const ids = new Set(campaignSelectedContactIds);
      return contacts.filter((c) => ids.has(c.id));
    }
    if (campaignRecipientMode === "numbers") {
      return [];
    }
    const ids = new Set<string>(campaignSelectedContactIds);
    if (campaignSelectedGroupNames.length > 0) {
      for (const c of contacts) {
        if (
          c.groups.some((g) =>
            campaignSelectedGroupNames.some(
              (x) => x.trim().toLowerCase() === g.trim().toLowerCase()
            )
          )
        ) {
          ids.add(c.id);
        }
      }
    }
    return contacts.filter((c) => ids.has(c.id));
  }, [
    contacts,
    campaignRecipientMode,
    campaignSelectedContactIds,
    campaignSelectedGroupNames,
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

  const { from: mFrom, to: mTo } = useMemo(() => monthRangeStrings(), []);
  const [statsOpen, setStatsOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState(mFrom);
  const [dateTo, setDateTo] = useState(mTo);
  const [appliedStatsFrom, setAppliedStatsFrom] = useState(mFrom);
  const [appliedStatsTo, setAppliedStatsTo] = useState(mTo);
  const [chipLabel, setChipLabel] = useState("Ce mois");
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
      groupEditOpen ||
      contactModalOpen ||
      importContactsOpen;
    document.body.style.overflow = anyModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [
    groupModalOpen,
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
    setCmNotes("");
    setCmGroups([]);
    setContactModalOpen(true);
  }, []);

  const openContactEdit = useCallback((row: ContactRowData) => {
    setContactModalMode("edit");
    setContactEditRow(row);
    setCmFirst(row.firstName);
    setCmLast(row.lastName);
    setCmPhone(row.phone);
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
    [],
  );

  const handleDeleteContacts = useCallback(
    (ids: string[]) => {
      const n = ids.length;
      openConfirmDelete(
        `Supprimer ${n} contact${n > 1 ? "s" : ""} ?`,
        `Cette action est irréversible. ${n > 1 ? "Les contacts sélectionnés seront" : "Le contact sera"} définitivement supprimé${n > 1 ? "s" : ""}.`,
        async () => {
          const { error } = await deleteClients(supabase, ids);
          if (error) throw error;
          setConfirmDeleteOpen(false);
          refreshContacts();
          showToast(`${n} contact${n > 1 ? "s" : ""} supprimé${n > 1 ? "s" : ""}.`);
        },
      );
    },
    [openConfirmDelete, supabase, refreshContacts, showToast],
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
        `Cette action est irréversible. ${n > 1 ? "Les groupes sélectionnés seront" : "Le groupe sera"} définitivement supprimé${n > 1 ? "s" : ""}. Les contacts ne seront pas supprimés.`,
        async () => {
          const { error } = await deleteGroups(supabase, ids);
          if (error) throw error;
          setConfirmDeleteOpen(false);
          refreshGroups();
          showToast(`${n} groupe${n > 1 ? "s" : ""} supprimé${n > 1 ? "s" : ""}.`);
        },
      );
    },
    [openConfirmDelete, supabase, refreshGroups, showToast],
  );

  const handleDeleteGroupFromModal = useCallback(() => {
    if (!groupEditRow) return;
    setGroupEditOpen(false);
    setGroupEditRow(null);
    handleDeleteGroups([groupEditRow.id]);
  }, [groupEditRow, handleDeleteGroups]);

  const openCampaignComposer = useCallback(
    (preselectedGroupName?: string) => {
      const p = preselectedGroupName?.trim() ?? "";
      setCampaignRecipientMode(p ? "lists" : "manual");
      setCampaignTitle(defaultCampaignTitle());
      setCampaignSender(smsSender);
      setSmsBody("");
      setSendMode("now");
      setScheduledAt(plusTenMinutesLocalValue());
      setAiOpen(false);
      setCampaignSelectedContactIds([]);
      setCampaignSelectedGroupNames(p ? [p] : []);
      setCampaignManualNumbers("");
      go("nouvelle-campagne-1");
    },
    [go, smsSender]
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

  const applyStatsRange = useCallback(() => {
    setAppliedStatsFrom(dateFrom);
    setAppliedStatsTo(dateTo);
    setChipLabel(`Période · ${fmtFr(dateFrom)} → ${fmtFr(dateTo)}`);
  }, [dateFrom, dateTo]);

  const handleCampaignConfirm = useCallback(async () => {
    if (!user?.id) {
      throw new Error("Tu dois être connecté pour enregistrer une campagne.");
    }
    const targetContacts = campaignRecipientMode !== "numbers"
      ? campaignSelectedContacts
          .filter((c) => c.optIn && !c.stopSms && isValidFrMobile(c.phone))
          .map((c) => ({ firstName: c.firstName, lastName: c.lastName, phone: c.phone }))
      : undefined;

    const { error } = await insertSmsCampaign(supabase, user.id, {
      title: campaignTitle,
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
      targetGroups: campaignSelectedGroupNames.length > 0 ? campaignSelectedGroupNames : undefined,
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
      if (trimmed) {
        setCmGroups((prev) =>
          prev.includes(trimmed) ? prev : [...prev, trimmed]
        );
      }
      showToast(
        selectedContactIds.length > 0
          ? `Groupe créé · ${selectedContactIds.length} contact${
              selectedContactIds.length > 1 ? "s" : ""
            } rattaché${selectedContactIds.length > 1 ? "s" : ""}`
          : "Groupe créé"
      );
    },
    [user, supabase, refreshGroups, refreshContacts, showToast]
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
    contacts,
    selectedGroupNames: campaignSelectedGroupNames,
    setSelectedGroupNames: setCampaignSelectedGroupNames,
    recipientMode: campaignRecipientMode,
    setRecipientMode: setCampaignRecipientMode,
    manualNumbers: campaignManualNumbers,
    setManualNumbers: setCampaignManualNumbers,
    selectedContactIds: campaignSelectedContactIds,
    setSelectedContactIds: setCampaignSelectedContactIds,
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
      case "statistiques":
        return (
          <StatistiquesView
            chipLabel={chipLabel}
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
      case "parametres":
        return (
          <ParametresView
            smsSender={smsSender}
            onSmsSenderChange={setSmsSender}
            qrPublicUrl={userQrPublicUrl}
            qrLoading={userQrLoading}
            qrError={userQrError}
            onRegenerateQr={regenerateUserQr}
            purchases={creditPurchases}
            purchasesLoading={creditsLoading}
            onInvoiceClick={(id: string) =>
              showToast(`Téléchargement de la facture ${id} (prototype)`)
            }
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
                throw new Error("Tu dois être connecté pour acheter des crédits.");
              }
              const { invoiceRef, error } = await buyCredits({
                packCode: selection.code,
                packLabel: selection.pack,
                credits: selection.credits,
                amountEur: Math.round((selection.priceHT + selection.priceHT * 0.2) * 100) / 100,
              });
              if (error) throw error;
              showToast(
                `Achat confirmé (${new Intl.NumberFormat("fr-FR").format(selection.credits)} crédits)${invoiceRef ? ` · ${invoiceRef}` : ""}`,
              );
            }}
          />
        );
      case "nouvelle-campagne-1":
        return <CampaignWizard step={1} {...campaignWizardProps} />;
      case "nouvelle-campagne-2":
        return <CampaignWizard step={2} {...campaignWizardProps} />;
      case "nouvelle-campagne-3":
        return <CampaignWizard step={3} {...campaignWizardProps} />;
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
          />
        );
    }
  };

  return (
    <>
      <AppShell
        route={route}
        go={go}
        onNewCampaign={() => openCampaignComposer()}
        creditsLabel={creditsLoading ? "…" : creditsBalanceLabel}
        onBuyCredits={() => go("acheter-credits")}
      >
        {renderRoute(route)}
      </AppShell>

      <GroupCreateModal
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        contacts={groupModalContacts}
        contactsLoading={contactsLoading}
        onCreated={onGroupCreatedFromModal}
      />
      <GroupEditModal
        open={groupEditOpen}
        group={groupEditRow}
        contacts={groupModalContacts}
        contactsLoading={contactsLoading}
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
        notes={cmNotes}
        setNotes={setCmNotes}
        groups={cmGroups}
        setGroups={setCmGroups}
        groupOptions={groupOptions}
        onCreateGroupRequest={() => {
          setContactModalOpen(false);
          setGroupModalOpen(true);
        }}
        consentDefaults={
          contactEditRow
            ? { optIn: contactEditRow.optIn, stop: contactEditRow.stopSms }
            : null
        }
        onSaveContact={handleContactSave}
        onDeleteContact={handleDeleteContactFromModal}
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
        onConfirm={confirmDeleteAction ?? (async () => {})}
        onCancel={() => setConfirmDeleteOpen(false)}
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
