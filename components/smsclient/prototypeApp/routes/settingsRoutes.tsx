"use client";

import { CampaignWizard } from "@/components/smsclient/FlowViews";
import {
  AcheterCreditsView,
  ContactsView,
  ParametresView,
  QrCodeView,
} from "@/components/smsclient/MainViews";
import type { AppRoute } from "@/lib/proto/routes";
import type { ReactNode } from "react";
import type { PrototypeAppContext } from "../usePrototypeApp";

const SETTINGS_ROUTES = new Set<AppRoute>([
  "qr-boutique",
  "parametres",
  "acheter-credits",
  "nouvelle-campagne",
]);

export function renderSettingsRoute(
  r: AppRoute,
  ctx: PrototypeAppContext
): ReactNode | null {
  if (!SETTINGS_ROUTES.has(r)) return null;
  const { data, modals, wizard, actions } = ctx;
  const {
    creditsState,
    profileState,
    userQrState,
    qrWheelState,
    trashState,
    customFieldsState,
    user,
  } = data;

  switch (r) {
    case "qr-boutique":
      return (
        <QrCodeView
          publicUrl={userQrState.publicUrl}
          loading={userQrState.loading}
          error={userQrState.error}
          companyName={profileState.profile?.companyName}
          captureMode={userQrState.captureMode}
          onCaptureModeChange={async (mode) => {
            if (mode === "wheel") {
              qrWheelState.patchEnabled(true);
            } else {
              qrWheelState.patchEnabled(false);
            }
            try {
              await userQrState.setCaptureMode(mode);
              if (
                mode === "wheel" &&
                (qrWheelState.config?.segments.length ?? 0) === 0
              ) {
                await qrWheelState.enableWithDefaults();
              }
            } catch {
              /* rollback optimiste */
            }
          }}
          welcomeSmsTemplate={userQrState.welcomeSmsTemplate}
          onWelcomeSmsTemplateChange={userQrState.setWelcomeSmsTemplate}
          wheelConfig={qrWheelState.config}
          wheelLoading={qrWheelState.loading}
          wheelSaving={modals.qrWheelSaving}
          onWheelSave={async (config) => {
            modals.setQrWheelSaving(true);
            try {
              await qrWheelState.saveAll(config);
            } finally {
              modals.setQrWheelSaving(false);
            }
          }}
          onWheelEnableDefaults={async () => {
            modals.setQrWheelSaving(true);
            try {
              await qrWheelState.enableWithDefaults();
            } finally {
              modals.setQrWheelSaving(false);
            }
          }}
        />
      );
    case "parametres":
      return (
        <ParametresView
          profileForm={
            profileState.profile
              ? ctx.profileToForm(profileState.profile)
              : null
          }
          profileLoading={profileState.loading}
          onSaveProfile={profileState.saveProfile}
          purchases={creditsState.purchases}
          purchasesLoading={creditsState.loading}
          onInvoiceClick={(id: string) =>
            modals.showToast(`Téléchargement de la facture ${id} (prototype)`)
          }
          trashContacts={trashState.contacts}
          trashGroups={trashState.groups}
          trashLoading={trashState.loading}
          trashError={trashState.error}
          onRestoreTrashContacts={actions.handleRestoreTrashContacts}
          onRestoreTrashGroups={actions.handleRestoreTrashGroups}
          onRefreshTrash={trashState.refresh}
          customFieldDefs={customFieldsState.defs}
          customFieldsLoading={customFieldsState.loading}
          customFieldsError={customFieldsState.error}
          onCreateCustomField={customFieldsState.createDef}
          onRenameCustomField={customFieldsState.renameDef}
          onRemoveCustomField={customFieldsState.removeDef}
        />
      );
    case "acheter-credits":
      return (
        <AcheterCreditsView
          creditsAvailable={creditsState.balance}
          onCancel={() => ctx.go("campagnes")}
          onBuy={async (selection) => {
            if (!user?.id) {
              throw new Error(
                "Vous devez être connecté pour acheter des crédits."
              );
            }
            const { invoiceRef, error } = await creditsState.buy({
              packCode: selection.code,
              packLabel: selection.pack,
              credits: selection.credits,
              amountEur:
                Math.round(
                  (selection.priceHT + selection.priceHT * 0.2) * 100
                ) / 100,
            });
            if (error) throw error;
            modals.showToast(
              `Achat confirmé (${new Intl.NumberFormat("fr-FR").format(
                selection.credits
              )} crédits)${invoiceRef ? ` · ${invoiceRef}` : ""}`
            );
          }}
        />
      );
    case "nouvelle-campagne":
      return <CampaignWizard {...wizard.campaignWizardProps} />;
    default:
      return null;
  }
}

export function renderDefaultRoute(ctx: PrototypeAppContext): ReactNode {
  const { data, modals, wizard, actions } = ctx;
  const { contactsState, customFieldsState } = data;
  return (
    <ContactsView
      rows={contactsState.rows}
      loading={contactsState.loading}
      error={contactsState.error}
      customFieldDefs={customFieldsState.defs}
      onImport={() => modals.setImportContactsOpen(true)}
      onAddContact={modals.openContactAdd}
      onRowClick={modals.openContactEdit}
      onDeleteContacts={actions.handleDeleteContacts}
      onCreateCampaignFromContacts={(ids) =>
        wizard.openCampaignComposer({ contactIds: ids })
      }
    />
  );
}
