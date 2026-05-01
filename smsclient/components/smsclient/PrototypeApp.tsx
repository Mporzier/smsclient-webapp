"use client";

import { AppShell } from "@/components/smsclient/Shell";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  CampagnesView,
  ContactsView,
  CreditsView,
  DeconnexionView,
  GroupesView,
  ParametresView,
  StatistiquesView,
} from "./MainViews";
import {
  AddContactFlow,
  CampaignWizard,
  CreateGroupFlow,
} from "@/components/smsclient/FlowViews";
import { ImportContactsModal } from "./ImportContactsModal";
import {
  CampaignDetailsModal,
  ContactCreateModal,
  CreditsModal,
  GroupEditModal,
  GroupQuickAddContactsModal,
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
  insertClient,
  updateClient,
} from "@/lib/supabase/clients";
import { insertSmsCampaign } from "@/lib/supabase/campaigns";
import { insertClientGroup, updateClientGroup } from "@/lib/supabase/groups";
import type { ContactFormSubmitPayload } from "@/lib/supabase/clients";
import type { GroupRowData } from "@/lib/types/group";
import type { CampaignRowData } from "@/lib/types/campaign";
import { type ContactRowData } from "@/lib/types/contact";
import { isValidFrMobile } from "@/lib/proto/smsUtils";
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
  const d = new Date(Date.now() + 10 * 60 * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
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
  const [groupQuickAddOpen, setGroupQuickAddOpen] = useState(false);
  const [groupQuickAddTarget, setGroupQuickAddTarget] =
    useState<GroupRowData | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactModalMode, setContactModalMode] = useState<"add" | "edit">(
    "add"
  );
  const [contactEditRow, setContactEditRow] = useState<ContactRowData | null>(
    null
  );
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [importContactsOpen, setImportContactsOpen] = useState(false);
  const [campaignDetailsOpen, setCampaignDetailsOpen] = useState(false);
  const [campaignDetailsRow, setCampaignDetailsRow] =
    useState<CampaignRowData | null>(null);

  const [cmFirst, setCmFirst] = useState("");
  const [cmLast, setCmLast] = useState("");
  const [cmPhone, setCmPhone] = useState("");
  const [cmNotes, setCmNotes] = useState("");
  const [cmGroups, setCmGroups] = useState<string[]>([]);

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

  const [campaignGoalPreset, setCampaignGoalPreset] = useState<
    "promotion" | "relance" | "nouveaute" | "fidelisation" | "libre"
  >("promotion");
  const [campaignGoalFreeText, setCampaignGoalFreeText] = useState("");
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

  const [acFirst, setAcFirst] = useState("");
  const [acLast, setAcLast] = useState("");
  const [acPhone, setAcPhone] = useState("");
  const [acGroups, setAcGroups] = useState<string[]>([]);
  const [cgName, setCgName] = useState("");
  const [cgDesc, setCgDesc] = useState("");
  const [cgColor, setCgColor] = useState("blue");

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
      groupQuickAddOpen ||
      contactModalOpen ||
      creditsModalOpen ||
      importContactsOpen;
    document.body.style.overflow = anyModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [
    groupModalOpen,
    groupEditOpen,
    groupQuickAddOpen,
    contactModalOpen,
    creditsModalOpen,
    importContactsOpen,
  ]);

  useEffect(() => {
    startTransition(() => {
      if (route !== "credits" && route !== "statistiques") {
        setCreditsModalOpen(false);
      }
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

  const openCampaignComposer = useCallback(
    (preselectedGroupName?: string) => {
      const p = preselectedGroupName?.trim() ?? "";
      setCampaignGoalPreset("promotion");
      setCampaignGoalFreeText("");
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
    const { error } = await insertSmsCampaign(supabase, user.id, {
      title: campaignTitle,
      sender: campaignSender,
      body: smsBody,
      sendMode,
      recipientCount: campaignRecipientCount,
      scheduledAt:
        sendMode === "sched"
          ? (() => {
              const d = new Date(scheduledAt);
              if (Number.isNaN(d.getTime())) {
                throw new Error("Date de programmation invalide.");
              }
              return d.toISOString();
            })()
          : null,
    });
    if (error) throw error;
    await refreshCampaigns();
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
    refreshCampaigns,
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
    async (payload: { id: string; name: string; description: string }) => {
      if (!user?.id) {
        throw new Error("Tu dois être connecté pour modifier un groupe.");
      }
      const { error } = await updateClientGroup(supabase, user.id, payload.id, {
        name: payload.name,
        description: payload.description,
      });
      if (error) throw error;
      await refreshGroups();
      showToast("Groupe modifié");
    },
    [user, supabase, refreshGroups, showToast]
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
    goalPreset: campaignGoalPreset,
    setGoalPreset: setCampaignGoalPreset,
    goalFreeText: campaignGoalFreeText,
    setGoalFreeText: setCampaignGoalFreeText,
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
      case "credits":
        return (
          <CreditsView
            balanceLabel={creditsBalanceLabel}
            purchases={creditPurchases}
            loading={creditsLoading}
            error={creditsError}
            onBuyCredits={() => setCreditsModalOpen(true)}
            onEditBillingInfo={() =>
              showToast("Edition de l’adresse de facturation (à implémenter).")
            }
            onEditPaymentMethod={() =>
              showToast("Edition de la carte bancaire (à implémenter).")
            }
            onInvoiceClick={(id: string) =>
              showToast(`Téléchargement de la facture ${id} (prototype)`)
            }
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
          />
        );
      case "deconnexion":
        return <DeconnexionView onBackContacts={() => go("contacts")} />;
      case "ajouter-contact-1":
        return (
          <AddContactFlow
            step={1}
            go={go}
            first={acFirst}
            setFirst={setAcFirst}
            last={acLast}
            setLast={setAcLast}
            phone={acPhone}
            setPhone={setAcPhone}
            groups={acGroups}
            setGroups={setAcGroups}
            groupOptions={groupOptions}
          />
        );
      case "ajouter-contact-2":
        return (
          <AddContactFlow
            step={2}
            go={go}
            first={acFirst}
            setFirst={setAcFirst}
            last={acLast}
            setLast={setAcLast}
            phone={acPhone}
            setPhone={setAcPhone}
            groups={acGroups}
            setGroups={setAcGroups}
            groupOptions={groupOptions}
          />
        );
      case "creer-groupe-1":
        return (
          <CreateGroupFlow
            step={1}
            go={go}
            name={cgName}
            setName={setCgName}
            desc={cgDesc}
            setDesc={setCgDesc}
            colorId={cgColor}
            setColorId={setCgColor}
            onOpenGroupModal={() => setGroupModalOpen(true)}
          />
        );
      case "creer-groupe-2":
        return (
          <CreateGroupFlow
            step={2}
            go={go}
            name={cgName}
            setName={setCgName}
            desc={cgDesc}
            setDesc={setCgDesc}
            colorId={cgColor}
            setColorId={setCgColor}
            onOpenGroupModal={() => setGroupModalOpen(true)}
          />
        );
      case "nouvelle-campagne-1":
      case "nouvelle-campagne-2":
      case "nouvelle-campagne-3":
      case "nouvelle-campagne-4":
      case "nouvelle-campagne-5":
        return <CampaignWizard step={1} {...campaignWizardProps} />;
      default:
        return (
          <ContactsView
            rows={contacts}
            loading={contactsLoading}
            error={contactsError}
            onImport={() => setImportContactsOpen(true)}
            onAddContact={openContactAdd}
            onRowClick={openContactEdit}
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
        onClose={() => {
          setGroupEditOpen(false);
          setGroupEditRow(null);
        }}
        onSave={handleGroupUpdate}
        onImportToGroup={() => {
          if (!groupEditRow) return;
          setGroupQuickAddTarget(groupEditRow);
          setGroupQuickAddOpen(true);
          setGroupEditOpen(false);
          setGroupEditRow(null);
        }}
        onLaunchCampaign={(groupName) => {
          setGroupEditOpen(false);
          setGroupEditRow(null);
          openCampaignComposer(groupName);
        }}
      />
      <GroupQuickAddContactsModal
        open={groupQuickAddOpen}
        groupName={groupQuickAddTarget?.name ?? ""}
        contacts={groupModalContacts}
        contactsLoading={contactsLoading}
        onClose={() => {
          setGroupQuickAddOpen(false);
          setGroupQuickAddTarget(null);
        }}
        onConfirm={async (selectedIds) => {
          if (!user?.id || !groupQuickAddTarget?.name) {
            throw new Error("Groupe introuvable.");
          }
          const result = await addClientsToGroupByName(
            supabase,
            user.id,
            selectedIds,
            groupQuickAddTarget.name
          );
          if (result.error) throw result.error;
          await refreshGroups();
          await refreshContacts();
          showToast(
            `${selectedIds.length} contact${
              selectedIds.length > 1 ? "s" : ""
            } ajouté${selectedIds.length > 1 ? "s" : ""} au groupe`
          );
        }}
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
      />

      <CreditsModal
        open={creditsModalOpen}
        onClose={() => setCreditsModalOpen(false)}
        onBought={async (selection) => {
          if (!user?.id) {
            throw new Error("Tu dois être connecté pour acheter des crédits.");
          }
          const { invoiceRef, error } = await buyCredits({
            packCode: selection.code,
            packLabel: selection.pack,
            credits: selection.credits,
            amountEur: selection.price,
          });
          if (error) {
            throw error;
          }
          showToast(
            `Achat confirmé (${new Intl.NumberFormat("fr-FR").format(
              selection.credits
            )} crédits)${invoiceRef ? ` · ${invoiceRef}` : ""}`
          );
        }}
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
