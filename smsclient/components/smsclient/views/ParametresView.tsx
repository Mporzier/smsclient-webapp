"use client";

import { BadgeSent, ProtoBtn } from "@/components/smsclient/ui";
import { DataTable } from "@/components/smsclient/DataTable";
import { ParametresSettingModal } from "@/components/smsclient/modals/ParametresSettingModal";
import { cn } from "@/lib/cn";
import { ParametresTrashSection } from "@/components/smsclient/views/ParametresTrashSection";
import { BusinessActivityPicker } from "@/components/onboarding/BusinessActivityPicker";
import type { CreditPurchaseRowData } from "@/lib/types/credits";
import type { UserProfileForm } from "@/lib/types/profile";
import type { DeletedContactRow, DeletedGroupRow } from "@/lib/types/trash";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  Hash,
  Mail,
  MapPin,
  MessageSquare,
  Shield,
  Sparkles,
  Trash2,
  UserCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";

export type ParametresViewProps = {
  profileForm: UserProfileForm | null;
  profileLoading?: boolean;
  onSaveProfile: (form: UserProfileForm) => Promise<void>;
  purchases?: CreditPurchaseRowData[];
  purchasesLoading?: boolean;
  onInvoiceClick?: (id: string) => void;
  trashContacts?: DeletedContactRow[];
  trashGroups?: DeletedGroupRow[];
  trashLoading?: boolean;
  trashError?: string | null;
  onRestoreTrashContacts?: (ids: string[]) => Promise<void>;
  onRestoreTrashGroups?: (ids: string[]) => Promise<void>;
  onRefreshTrash?: () => Promise<void>;
};

type SettingId =
  | "entreprise"
  | "identifiants-legaux"
  | "adresse-facturation"
  | "contact-facturation"
  | "abonnement"
  | "paiement"
  | "securite"
  | "factures"
  | "expediteur-sms"
  | "notifications-email"
  | "resume-mensuel"
  | "corbeille";

type SettingCardDef = {
  id: SettingId;
  title: string;
  description: string;
  icon: LucideIcon;
  savable?: boolean;
};

const emptyForm: UserProfileForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  companyName: "",
  businessActivity: "",
  siret: "",
  tva: "",
  address: "",
  zip: "",
  city: "",
  country: "France",
  billingContact: "",
  sender: "",
  notifyInvoices: true,
  notifySummary: true,
};

const inp =
  "h-11 w-full rounded-[14px] border border-slate-300/50 bg-white px-3.5 text-[15px] font-bold text-slate-900 outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]";
const lbl = "mb-1.5 block text-xs font-black text-slate-600";

const invoiceColumns: ColumnDef<CreditPurchaseRowData, unknown>[] = [
  { accessorKey: "createdLabel", header: "Date" },
  {
    accessorKey: "packLabel",
    header: "Pack",
    cell: ({ getValue }) => (
      <span className="font-bold">{getValue<string>()}</span>
    ),
  },
  { accessorKey: "amountLabel", header: "Prix", size: 90 },
  {
    accessorKey: "status",
    header: "Statut",
    size: 100,
    cell: ({ getValue }) => {
      const status = getValue<string>();
      return status === "paid" ? (
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-500/12 px-2 py-0.5 text-[11px] font-black text-emerald-800">
          Payée
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-400/15 px-2 py-0.5 text-[11px] font-black text-slate-700">
          Remboursée
        </span>
      );
    },
  },
  { accessorKey: "creditsLabel", header: "Crédits", size: 80 },
];

const allSettingCards: SettingCardDef[] = [
  {
    id: "entreprise",
    title: "Entreprise",
    description: "Nom et secteur d'activité.",
    icon: Building2,
    savable: true,
  },
  {
    id: "identifiants-legaux",
    title: "SIRET & TVA",
    description: "Identifiants légaux de l'entreprise.",
    icon: Hash,
    savable: true,
  },
  {
    id: "adresse-facturation",
    title: "Adresse",
    description: "Adresse postale de facturation.",
    icon: MapPin,
    savable: true,
  },
  {
    id: "contact-facturation",
    title: "Contact facturation",
    description: "Personne à contacter pour la facturation.",
    icon: UserCircle,
    savable: true,
  },
  {
    id: "abonnement",
    title: "Abonnement",
    description: "Formule et mode de facturation.",
    icon: Sparkles,
  },
  {
    id: "paiement",
    title: "Paiement",
    description: "Carte bancaire enregistrée.",
    icon: CreditCard,
  },
  {
    id: "securite",
    title: "Sécurité",
    description: "Authentification à deux facteurs.",
    icon: Shield,
  },
  {
    id: "factures",
    title: "Factures",
    description: "Historique des achats de crédits.",
    icon: FileText,
  },
  {
    id: "expediteur-sms",
    title: "Expéditeur SMS",
    description: "Nom affiché aux destinataires.",
    icon: MessageSquare,
    savable: true,
  },
  {
    id: "notifications-email",
    title: "Alertes email",
    description: "Factures et notifications importantes.",
    icon: Mail,
    savable: true,
  },
  {
    id: "resume-mensuel",
    title: "Résumé mensuel",
    description: "Synthèse de vos campagnes par email.",
    icon: BarChart3,
    savable: true,
  },
  {
    id: "corbeille",
    title: "Corbeille",
    description: "Contacts et groupes supprimés.",
    icon: Trash2,
  },
];

function SettingCard({
  title,
  description,
  icon: Icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex cursor-pointer flex-col rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
    >
      <Icon
        className="h-4 w-4 shrink-0 text-[#2f6fed]"
        strokeWidth={2}
        aria-hidden
      />
      <span className="mt-2 text-sm font-bold leading-tight text-slate-900">
        {title}
      </span>
      <span className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-slate-500">
        {description}
      </span>
    </button>
  );
}

function ModalPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {children}
    </div>
  );
}

export function ParametresView({
  profileForm,
  profileLoading = false,
  onSaveProfile,
  purchases = [],
  purchasesLoading = false,
  onInvoiceClick,
  trashContacts = [],
  trashGroups = [],
  trashLoading = false,
  trashError = null,
  onRestoreTrashContacts,
  onRestoreTrashGroups,
  onRefreshTrash,
}: ParametresViewProps) {
  const [savedForm, setSavedForm] = useState<UserProfileForm>(emptyForm);
  const [draftForm, setDraftForm] = useState<UserProfileForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [openSetting, setOpenSetting] = useState<SettingId | null>(null);

  const dirty = JSON.stringify(draftForm) !== JSON.stringify(savedForm);
  const changed = <K extends keyof UserProfileForm>(key: K) =>
    draftForm[key] !== savedForm[key];

  const openCard = allSettingCards.find((c) => c.id === openSetting);

  useEffect(() => {
    if (!profileForm || dirty) return;
    setSavedForm(profileForm);
    setDraftForm(profileForm);
  }, [profileForm, dirty]);

  const setField = <K extends keyof UserProfileForm>(
    key: K,
    value: UserProfileForm[K]
  ) => {
    setDraftForm((prev) => ({ ...prev, [key]: value }));
  };

  const closeModal = () => {
    setOpenSetting(null);
    setSaveError(null);
  };

  const handleCloseModal = () => {
    if (dirty) setDraftForm(savedForm);
    closeModal();
  };

  const validateBeforeSave = (): string | null => {
    switch (openSetting) {
      case "entreprise":
        if (!draftForm.companyName.trim()) {
          return "Le nom de l'entreprise est requis.";
        }
        if (!draftForm.businessActivity) {
          return "L'activité de l'entreprise est requise.";
        }
        return null;
      case "expediteur-sms":
        if (!draftForm.sender.trim()) {
          return "Le nom d'expéditeur SMS est requis.";
        }
        return null;
      default:
        return null;
    }
  };

  const onSaveChanges = async () => {
    if (!dirty) return;
    const validationError = validateBeforeSave();
    if (validationError) {
      setSaveError(validationError);
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      await onSaveProfile(draftForm);
      setSavedForm(draftForm);
      closeModal();
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Sauvegarde impossible."
      );
    } finally {
      setSaving(false);
    }
  };

  const trashAvailable =
    Boolean(onRestoreTrashContacts) &&
    Boolean(onRestoreTrashGroups) &&
    Boolean(onRefreshTrash);

  const visibleCards = trashAvailable
    ? allSettingCards
    : allSettingCards.filter((c) => c.id !== "corbeille");

  const modalIcon = openCard ? (
    <openCard.icon className="h-5 w-5" strokeWidth={2.25} />
  ) : null;

  return (
    <>
      <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
        {visibleCards.map((card) => (
          <SettingCard
            key={card.id}
            title={card.title}
            description={card.description}
            icon={card.icon}
            onClick={() => setOpenSetting(card.id)}
          />
        ))}
      </div>

      {openCard && (
        <ParametresSettingModal
          open={openSetting !== null}
          title={openCard.title}
          description={openCard.description}
          icon={modalIcon}
          onClose={handleCloseModal}
          onSave={openCard.savable ? onSaveChanges : undefined}
          saving={saving}
          dirty={dirty}
          wide={
            openSetting === "factures" ||
            openSetting === "corbeille" ||
            openSetting === "adresse-facturation"
          }
        >
          {profileLoading && openCard.savable && (
            <p className="m-0 mb-3 text-sm font-semibold text-slate-500">
              Chargement…
            </p>
          )}
          {saveError && (
            <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
              {saveError}
            </p>
          )}

          {openSetting === "entreprise" && (
            <ModalPanel>
              <div className="grid gap-3">
                <div>
                  <label className={lbl}>Nom de l&apos;entreprise</label>
                  <input
                    className={cn(
                      inp,
                      changed("companyName") &&
                        "border-blue-400 ring-2 ring-blue-100"
                    )}
                    value={draftForm.companyName}
                    onChange={(e) => setField("companyName", e.target.value)}
                  />
                </div>
                <div>
                  <label className={lbl}>Secteur d&apos;activité</label>
                  <div
                    className={cn(
                      "rounded-xl p-1",
                      changed("businessActivity") && "ring-2 ring-blue-100"
                    )}
                  >
                    <BusinessActivityPicker
                      value={draftForm.businessActivity}
                      onChange={(id) => setField("businessActivity", id)}
                    />
                  </div>
                </div>
              </div>
            </ModalPanel>
          )}

          {openSetting === "identifiants-legaux" && (
            <ModalPanel>
              <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                <div>
                  <label className={lbl}>SIRET</label>
                  <input
                    className={cn(
                      inp,
                      changed("siret") && "border-blue-400 ring-2 ring-blue-100"
                    )}
                    value={draftForm.siret}
                    onChange={(e) => setField("siret", e.target.value)}
                  />
                </div>
                <div>
                  <label className={lbl}>TVA</label>
                  <input
                    className={cn(
                      inp,
                      changed("tva") && "border-blue-400 ring-2 ring-blue-100"
                    )}
                    value={draftForm.tva}
                    onChange={(e) => setField("tva", e.target.value)}
                  />
                </div>
              </div>
            </ModalPanel>
          )}

          {openSetting === "adresse-facturation" && (
            <ModalPanel>
              <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                <div className="col-span-2">
                  <label className={lbl}>Adresse</label>
                  <input
                    className={cn(
                      inp,
                      changed("address") && "border-blue-400 ring-2 ring-blue-100"
                    )}
                    value={draftForm.address}
                    onChange={(e) => setField("address", e.target.value)}
                  />
                </div>
                <div>
                  <label className={lbl}>Code postal</label>
                  <input
                    className={cn(
                      inp,
                      changed("zip") && "border-blue-400 ring-2 ring-blue-100"
                    )}
                    value={draftForm.zip}
                    onChange={(e) => setField("zip", e.target.value)}
                  />
                </div>
                <div>
                  <label className={lbl}>Ville</label>
                  <input
                    className={cn(
                      inp,
                      changed("city") && "border-blue-400 ring-2 ring-blue-100"
                    )}
                    value={draftForm.city}
                    onChange={(e) => setField("city", e.target.value)}
                  />
                </div>
                <div className="col-span-2 max-[480px]:col-span-1">
                  <label className={lbl}>Pays</label>
                  <input
                    className={cn(
                      inp,
                      changed("country") && "border-blue-400 ring-2 ring-blue-100"
                    )}
                    value={draftForm.country}
                    onChange={(e) => setField("country", e.target.value)}
                  />
                </div>
              </div>
            </ModalPanel>
          )}

          {openSetting === "contact-facturation" && (
            <ModalPanel>
              <div>
                <label className={lbl}>Contact facturation</label>
                <input
                  className={cn(
                    inp,
                    changed("billingContact") &&
                      "border-blue-400 ring-2 ring-blue-100"
                  )}
                  value={draftForm.billingContact}
                  onChange={(e) => setField("billingContact", e.target.value)}
                  placeholder="Nom ou email du contact"
                />
              </div>
            </ModalPanel>
          )}

          {openSetting === "abonnement" && (
            <ModalPanel>
              <div className="flex justify-between gap-3 text-sm font-extrabold">
                <span className="text-slate-600">Formule</span>
                <strong>Pay-as-you-go</strong>
              </div>
              <p className="m-0 mt-2 text-xs font-semibold text-slate-500">
                Vous payez uniquement les crédits SMS consommés.
              </p>
            </ModalPanel>
          )}

          {openSetting === "paiement" && (
            <ModalPanel>
              <div className="flex justify-between gap-3 text-sm font-extrabold">
                <span className="text-slate-600">Carte enregistrée</span>
                <strong>VISA •••• 8003</strong>
              </div>
              <div className="mt-3">
                <ProtoBtn>Modifier la carte</ProtoBtn>
              </div>
            </ModalPanel>
          )}

          {openSetting === "securite" && (
            <ModalPanel>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-extrabold text-slate-600">
                  Authentification 2FA
                </span>
                <BadgeSent>Activé</BadgeSent>
              </div>
              <div className="mt-3">
                <ProtoBtn>Gérer la sécurité</ProtoBtn>
              </div>
            </ModalPanel>
          )}

          {openSetting === "factures" && (
            <InvoicesTable
              purchases={purchases}
              loading={purchasesLoading}
              onInvoiceClick={onInvoiceClick}
            />
          )}

          {openSetting === "expediteur-sms" && (
            <ModalPanel>
              <div>
                <label className={lbl}>
                  Nom d&apos;expéditeur SMS (11 car. max)
                </label>
                <input
                  className={cn(
                    inp,
                    changed("sender") && "border-blue-400 ring-2 ring-blue-100"
                  )}
                  maxLength={11}
                  value={draftForm.sender}
                  onChange={(e) => setField("sender", e.target.value)}
                  placeholder="BOULANGERIE"
                  autoComplete="off"
                />
                <p className="mt-1.5 text-xs font-bold text-slate-500">
                  Affiché comme expéditeur de vos campagnes SMS.
                </p>
              </div>
            </ModalPanel>
          )}

          {openSetting === "notifications-email" && (
            <ModalPanel>
              <label className="flex items-start gap-2.5 text-sm font-extrabold text-slate-600">
                <input
                  type="checkbox"
                  className="mt-0.5 h-[18px] w-[18px]"
                  checked={draftForm.notifyInvoices}
                  onChange={(e) => setField("notifyInvoices", e.target.checked)}
                />
                Recevoir les notifications email (factures, alertes)
              </label>
            </ModalPanel>
          )}

          {openSetting === "resume-mensuel" && (
            <ModalPanel>
              <label className="flex items-start gap-2.5 text-sm font-extrabold text-slate-600">
                <input
                  type="checkbox"
                  className="mt-0.5 h-[18px] w-[18px]"
                  checked={draftForm.notifySummary}
                  onChange={(e) => setField("notifySummary", e.target.checked)}
                />
                Recevoir un résumé mensuel de vos campagnes par email
              </label>
            </ModalPanel>
          )}

          {openSetting === "corbeille" && trashAvailable && (
            <ParametresTrashSection
              contacts={trashContacts}
              groups={trashGroups}
              loading={trashLoading}
              error={trashError}
              onRestoreContacts={onRestoreTrashContacts!}
              onRestoreGroups={onRestoreTrashGroups!}
              onRefresh={onRefreshTrash!}
            />
          )}
        </ParametresSettingModal>
      )}
    </>
  );
}

function InvoicesTable({
  purchases,
  loading,
  onInvoiceClick,
}: {
  purchases: CreditPurchaseRowData[];
  loading: boolean;
  onInvoiceClick?: (id: string) => void;
}) {
  const cols = useMemo(
    (): ColumnDef<CreditPurchaseRowData, unknown>[] => [
      ...invoiceColumns,
      ...(onInvoiceClick
        ? [
            {
              id: "actions",
              header: "PDF",
              size: 140,
              cell: ({ row }: { row: { original: CreditPurchaseRowData } }) => (
                <ProtoBtn
                  className="h-8 px-2.5 text-xs"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onInvoiceClick(row.original.invoiceRef);
                  }}
                >
                  Télécharger
                </ProtoBtn>
              ),
            } as ColumnDef<CreditPurchaseRowData, unknown>,
          ]
        : []),
    ],
    [onInvoiceClick]
  );

  return (
    <DataTable
      columns={cols}
      data={purchases}
      loading={loading}
      pageSize={10}
      emptyMessage="Aucune facture pour l'instant."
      loadingMessage="Chargement des factures…"
      footer={`${purchases.length} facture${purchases.length > 1 ? "s" : ""}`}
    />
  );
}
