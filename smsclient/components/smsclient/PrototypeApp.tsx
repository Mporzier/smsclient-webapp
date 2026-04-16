"use client";

import { AppShell } from "@/components/smsclient/Shell";
import { LandingScreens } from "@/components/smsclient/Landing";
import {
  CampagnesView,
  ContactRowData,
  ContactsView,
  CreditsView,
  DeconnexionView,
  GroupesView,
  ParametresView,
  StatistiquesView,
} from "@/components/smsclient/MainViews";
import {
  AjouterContactFlow,
  CampagneWizard,
  CreerGroupeFlow,
} from "@/components/smsclient/FlowViews";
import {
  ContactModal,
  CreditsModal,
  GroupModal,
} from "@/components/smsclient/PrototypeModals";
import { useProtoNavigation } from "@/hooks/useProtoNavigation";
import type { AppRoute } from "@/lib/proto/routes";
import { useCallback, useEffect, useMemo, useState } from "react";

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

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactModalMode, setContactModalMode] = useState<"add" | "edit">("add");
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);

  const [cmFirst, setCmFirst] = useState("");
  const [cmLast, setCmLast] = useState("");
  const [cmPhone, setCmPhone] = useState("");
  const [cmGroup, setCmGroup] = useState("");
  const [extraGroups, setExtraGroups] = useState<string[]>([]);

  const groupOptions = useMemo(
    () => [...new Set(["Clients VIP", "Clients Fidèles", "Prospects", ...extraGroups])],
    [extraGroups],
  );

  const [acFirst, setAcFirst] = useState("");
  const [acLast, setAcLast] = useState("");
  const [acPhone, setAcPhone] = useState("");
  const [acGroup, setAcGroup] = useState("");
  const [acOptIn, setAcOptIn] = useState(true);
  const [acStop, setAcStop] = useState(false);

  const [cgName, setCgName] = useState("");
  const [cgDesc, setCgDesc] = useState("");
  const [cgColor, setCgColor] = useState("blue");

  const [campaignTitle, setCampaignTitle] = useState("Promo Janvier - VIP");
  const [campaignSender, setCampaignSender] = useState("BOULANGERIE");
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
    const anyModal = groupModalOpen || contactModalOpen || creditsModalOpen;
    document.body.style.overflow = anyModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [groupModalOpen, contactModalOpen, creditsModalOpen]);

  useEffect(() => {
    if (route !== "credits" && route !== "statistiques") {
      setCreditsModalOpen(false);
    }
    if (route !== "statistiques") setStatsOpen(false);
  }, [route]);

  const openContactAdd = useCallback(() => {
    setContactModalMode("add");
    setCmFirst("");
    setCmLast("");
    setCmPhone("");
    setCmGroup("");
    setContactModalOpen(true);
  }, []);

  const openContactEdit = useCallback((row: ContactRowData) => {
    setContactModalMode("edit");
    setCmFirst(row.name);
    setCmLast("");
    setCmPhone(row.phone);
    setCmGroup(row.group === "Non Classé" ? "" : row.group);
    setContactModalOpen(true);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, []);

  const applyStatsRange = useCallback(() => {
    setChipLabel(`Période · ${fmtFr(dateFrom)} → ${fmtFr(dateTo)}`);
  }, [dateFrom, dateTo]);

  const onGroupCreatedFromModal = useCallback((name: string, desc: string) => {
    const n = name.trim();
    if (n) setExtraGroups((prev) => (prev.includes(n) ? prev : [...prev, n]));
    void desc;
  }, []);

  const renderRoute = (r: AppRoute) => {
    switch (r) {
      case "contacts":
        return (
          <ContactsView onAddContact={openContactAdd} onRowClick={openContactEdit} />
        );
      case "groupes":
        return <GroupesView onCreateGroup={() => setGroupModalOpen(true)} />;
      case "campagnes":
        return <CampagnesView onNewCampaign={() => go("nouvelle-campagne-1")} />;
      case "credits":
        return (
          <CreditsView
            onBuyCredits={() => setCreditsModalOpen(true)}
            onInvoiceClick={(id) =>
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
        return <ParametresView />;
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
            group={acGroup}
            setGroup={setAcGroup}
            optIn={acOptIn}
            setOptIn={setAcOptIn}
            stop={acStop}
            setStop={setAcStop}
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
            group={acGroup}
            setGroup={setAcGroup}
            optIn={acOptIn}
            setOptIn={setAcOptIn}
            stop={acStop}
            setStop={setAcStop}
          />
        );
      case "ajouter-contact-3":
        return (
          <AjouterContactFlow
            step={3}
            go={go}
            first={acFirst}
            setFirst={setAcFirst}
            last={acLast}
            setLast={setAcLast}
            phone={acPhone}
            setPhone={setAcPhone}
            group={acGroup}
            setGroup={setAcGroup}
            optIn={acOptIn}
            setOptIn={setAcOptIn}
            stop={acStop}
            setStop={setAcStop}
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
            sender={campaignSender}
            setSender={setCampaignSender}
            sms={smsBody}
            setSms={setSmsBody}
            sendMode={sendMode}
            setSendMode={setSendMode}
            aiOpen={aiOpen}
            setAiOpen={setAiOpen}
          />
        );
      case "nouvelle-campagne-2":
        return (
          <CampagneWizard
            step={2}
            go={go}
            title={campaignTitle}
            setTitle={setCampaignTitle}
            sender={campaignSender}
            setSender={setCampaignSender}
            sms={smsBody}
            setSms={setSmsBody}
            sendMode={sendMode}
            setSendMode={setSendMode}
            aiOpen={aiOpen}
            setAiOpen={setAiOpen}
          />
        );
      case "nouvelle-campagne-3":
        return (
          <CampagneWizard
            step={3}
            go={go}
            title={campaignTitle}
            setTitle={setCampaignTitle}
            sender={campaignSender}
            setSender={setCampaignSender}
            sms={smsBody}
            setSms={setSmsBody}
            sendMode={sendMode}
            setSendMode={setSendMode}
            aiOpen={aiOpen}
            setAiOpen={setAiOpen}
          />
        );
      case "nouvelle-campagne-4":
        return (
          <CampagneWizard
            step={4}
            go={go}
            title={campaignTitle}
            setTitle={setCampaignTitle}
            sender={campaignSender}
            setSender={setCampaignSender}
            sms={smsBody}
            setSms={setSmsBody}
            sendMode={sendMode}
            setSendMode={setSendMode}
            aiOpen={aiOpen}
            setAiOpen={setAiOpen}
          />
        );
      case "nouvelle-campagne-5":
        return (
          <CampagneWizard
            step={5}
            go={go}
            title={campaignTitle}
            setTitle={setCampaignTitle}
            sender={campaignSender}
            setSender={setCampaignSender}
            sms={smsBody}
            setSms={setSmsBody}
            sendMode={sendMode}
            setSendMode={setSendMode}
            aiOpen={aiOpen}
            setAiOpen={setAiOpen}
          />
        );
      default:
        return (
          <ContactsView onAddContact={openContactAdd} onRowClick={openContactEdit} />
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
        onCreated={(name, desc) => {
          onGroupCreatedFromModal(name, desc);
          if (name.trim()) setCmGroup(name.trim());
        }}
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
        group={cmGroup}
        setGroup={setCmGroup}
        groupOptions={groupOptions}
        onCreateGroupRequest={() => {
          setGroupModalOpen(true);
          setCmGroup("");
        }}
      />

      <CreditsModal
        open={creditsModalOpen}
        onClose={() => setCreditsModalOpen(false)}
        onBought={() => showToast("Achat confirmé (prototype).")}
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
