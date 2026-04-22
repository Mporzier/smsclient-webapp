"use client";

import { AppShell } from "@/components/smsclient/Shell";
import { useAuth } from "@/components/auth/AuthProvider";
import { LandingScreens } from "@/components/smsclient/Landing";
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
  AjouterContactFlow,
  CampagneWizard,
  CreerGroupeFlow,
} from "@/components/smsclient/FlowViews";
import { ImportContactsModal } from "./ImportContactsModal";
import {
  ContactModal,
  CreditsModal,
  GroupModal,
} from "@/components/smsclient/PrototypeModals";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useContacts } from "@/hooks/useContacts";
import { useGroups } from "@/hooks/useGroups";
import { usePersistedSmsSender } from "@/hooks/usePersistedSmsSender";
import { useProtoNavigation } from "@/hooks/useProtoNavigation";
import { createClient } from "@/lib/supabase/client";
import {
  addClientsToGroupByName,
  insertClient,
  updateClient,
} from "@/lib/supabase/clients";
import { insertSmsCampaign } from "@/lib/supabase/campaigns";
import { insertClientGroup } from "@/lib/supabase/groups";
import type { ContactFormSubmitPayload } from "@/lib/supabase/clients";
import {
  isCampaignEligibleContact,
  type ContactRowData,
} from "@/lib/types/contact";
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

export function PrototypeApp() {
  const { landing, route, go } = useProtoNavigation();
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

  const { sender: smsSender, setSender: setSmsSender } = usePersistedSmsSender();

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactModalMode, setContactModalMode] = useState<"add" | "edit">("add");
  const [contactEditRow, setContactEditRow] = useState<ContactRowData | null>(null);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [importContactsOpen, setImportContactsOpen] = useState(false);

  const [cmFirst, setCmFirst] = useState("");
  const [cmLast, setCmLast] = useState("");
  const [cmPhone, setCmPhone] = useState("");
  const [cmGroups, setCmGroups] = useState<string[]>([]);

  const groupOptions = useMemo(() => {
    const fromDb = groupRows.map((g) => g.name);
    const fromContacts = [
      ...new Set(contacts.flatMap((c) => c.groups)),
    ];
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
    [contacts],
  );

  const campaignRecipientCount = useMemo(
    () => contacts.filter((c) => isCampaignEligibleContact(c)).length,
    [contacts],
  );

  const [acFirst, setAcFirst] = useState("");
  const [acLast, setAcLast] = useState("");
  const [acPhone, setAcPhone] = useState("");
  const [acGroups, setAcGroups] = useState<string[]>([]);
  const [cgName, setCgName] = useState("");
  const [cgDesc, setCgDesc] = useState("");
  const [cgColor, setCgColor] = useState("blue");

  const [campaignTitle, setCampaignTitle] = useState("Promo Janvier - VIP");
  const [smsBody, setSmsBody] = useState(DEFAULT_SMS);
  const [sendMode, setSendMode] = useState<"now" | "sched">("now");
  const [aiOpen, setAiOpen] = useState(false);

  const { from: mFrom, to: mTo } = useMemo(() => monthRangeStrings(), []);
  const [statsOpen, setStatsOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState(mFrom);
  const [dateTo, setDateTo] = useState(mTo);
  const [chipLabel, setChipLabel] = useState("Ce mois");

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const anyModal =
      groupModalOpen ||
      contactModalOpen ||
      creditsModalOpen ||
      importContactsOpen;
    document.body.style.overflow = anyModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [groupModalOpen, contactModalOpen, creditsModalOpen, importContactsOpen]);

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
    setCmGroups([]);
    setContactModalOpen(true);
  }, []);

  const openContactEdit = useCallback((row: ContactRowData) => {
    setContactModalMode("edit");
    setContactEditRow(row);
    setCmFirst(row.firstName);
    setCmLast(row.lastName);
    setCmPhone(row.phone);
    setCmGroups([...row.groups]);
    setContactModalOpen(true);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, []);

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
          payload,
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
    ],
  );

  const applyStatsRange = useCallback(() => {
    setChipLabel(`Période · ${fmtFr(dateFrom)} → ${fmtFr(dateTo)}`);
  }, [dateFrom, dateTo]);

  const handleCampaignConfirm = useCallback(async () => {
    if (!user?.id) {
      throw new Error("Tu dois être connecté pour enregistrer une campagne.");
    }
    const { error } = await insertSmsCampaign(supabase, user.id, {
      title: campaignTitle,
      sender: smsSender,
      body: smsBody,
      sendMode,
      recipientCount: campaignRecipientCount,
    });
    if (error) throw error;
    await refreshCampaigns();
    showToast("Campagne enregistrée");
  }, [
    user,
    supabase,
    campaignTitle,
    smsSender,
    smsBody,
    sendMode,
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
          trimmed,
        );
        if (assign.error) throw assign.error;
      }
      await refreshGroups();
      await refreshContacts();
      if (trimmed) {
        setCmGroups((prev) =>
          prev.includes(trimmed) ? prev : [...prev, trimmed],
        );
      }
      showToast(
        selectedContactIds.length > 0
          ? `Groupe créé · ${selectedContactIds.length} contact${selectedContactIds.length > 1 ? "s" : ""} rattaché${selectedContactIds.length > 1 ? "s" : ""}`
          : "Groupe créé",
      );
    },
    [user, supabase, refreshGroups, refreshContacts, showToast],
  );

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
          />
        );
      case "campagnes":
        return (
          <CampagnesView
            rows={campaignRows}
            loading={campaignsLoading}
            error={campaignsError}
            onNewCampaign={() => go("nouvelle-campagne-1")}
          />
        );
      case "credits":
        return (
          <CreditsView
            onBuyCredits={() => setCreditsModalOpen(true)}
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
          />
        );
      case "parametres":
        return (
          <ParametresView
            smsSender={smsSender}
            onSmsSenderChange={setSmsSender}
          />
        );
      case "deconnexion":
        return <DeconnexionView onBackContacts={() => go("contacts")} />;
      case "ajouter-contact-1":
        return (
          <AjouterContactFlow
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
          <AjouterContactFlow
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
          <CreerGroupeFlow
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
          <CreerGroupeFlow
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
        return (
          <CampagneWizard
            step={1}
            go={go}
            title={campaignTitle}
            setTitle={setCampaignTitle}
            sender={smsSender}
            sms={smsBody}
            setSms={setSmsBody}
            sendMode={sendMode}
            setSendMode={setSendMode}
            aiOpen={aiOpen}
            setAiOpen={setAiOpen}
            recipientCount={campaignRecipientCount}
            onConfirmCampaign={handleCampaignConfirm}
          />
        );
      case "nouvelle-campagne-2":
        return (
          <CampagneWizard
            step={2}
            go={go}
            title={campaignTitle}
            setTitle={setCampaignTitle}
            sender={smsSender}
            sms={smsBody}
            setSms={setSmsBody}
            sendMode={sendMode}
            setSendMode={setSendMode}
            aiOpen={aiOpen}
            setAiOpen={setAiOpen}
            recipientCount={campaignRecipientCount}
            onConfirmCampaign={handleCampaignConfirm}
          />
        );
      case "nouvelle-campagne-3":
        return (
          <CampagneWizard
            step={3}
            go={go}
            title={campaignTitle}
            setTitle={setCampaignTitle}
            sender={smsSender}
            sms={smsBody}
            setSms={setSmsBody}
            sendMode={sendMode}
            setSendMode={setSendMode}
            aiOpen={aiOpen}
            setAiOpen={setAiOpen}
            recipientCount={campaignRecipientCount}
            onConfirmCampaign={handleCampaignConfirm}
          />
        );
      case "nouvelle-campagne-4":
        return (
          <CampagneWizard
            step={4}
            go={go}
            title={campaignTitle}
            setTitle={setCampaignTitle}
            sender={smsSender}
            sms={smsBody}
            setSms={setSmsBody}
            sendMode={sendMode}
            setSendMode={setSendMode}
            aiOpen={aiOpen}
            setAiOpen={setAiOpen}
            recipientCount={campaignRecipientCount}
            onConfirmCampaign={handleCampaignConfirm}
          />
        );
      case "nouvelle-campagne-5":
        return (
          <CampagneWizard
            step={5}
            go={go}
            title={campaignTitle}
            setTitle={setCampaignTitle}
            sender={smsSender}
            sms={smsBody}
            setSms={setSmsBody}
            sendMode={sendMode}
            setSendMode={setSendMode}
            aiOpen={aiOpen}
            setAiOpen={setAiOpen}
            recipientCount={campaignRecipientCount}
            onConfirmCampaign={handleCampaignConfirm}
          />
        );
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
      {landing && (
        <LandingScreens
          screen={landing}
          onOpenFeatures={() => go("features")}
          onOpenMvp={() => go("contacts")}
          onBackHome={() => go("home")}
          onMvpFromFeatures={() => go("contacts")}
        />
      )}

      {!landing && (
        <AppShell
          route={route}
          go={go}
          onNewCampaign={() => go("nouvelle-campagne-1")}
        >
          {renderRoute(route)}
        </AppShell>
      )}

      <GroupModal
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        contacts={groupModalContacts}
        contactsLoading={contactsLoading}
        onCreated={onGroupCreatedFromModal}
      />

      <ContactModal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        mode={contactModalMode}
        first={cmFirst}
        setFirst={setCmFirst}
        last={cmLast}
        setLast={setCmLast}
        phone={cmPhone}
        setPhone={setCmPhone}
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
        onBought={() => showToast("Achat confirmé (prototype).")}
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
