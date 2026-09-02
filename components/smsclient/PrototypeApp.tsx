"use client";

import { AppShell } from "@/components/smsclient/Shell";
import { PrototypeAppModals } from "./prototypeApp/PrototypeAppModals";
import { PrototypeRouteContent } from "./prototypeApp/PrototypeRouteContent";
import { usePrototypeApp } from "./prototypeApp/usePrototypeApp";

export function PrototypeApp() {
  const ctx = usePrototypeApp();

  return (
    <>
      <AppShell
        route={ctx.route}
        go={ctx.wizard.guardedGo}
        onNewCampaign={() => ctx.modals.setCampaignNameOpen(true)}
        onOpenFeedback={() => ctx.modals.setFeedbackOpen(true)}
        creditsLabel={
          ctx.data.creditsState.loading ? "…" : ctx.data.creditsState.balanceLabel
        }
        campaignWizardStep={
          ctx.route === "nouvelle-campagne"
            ? ctx.wizard.campaignWizardStep
            : undefined
        }
      >
        <PrototypeRouteContent ctx={ctx} />
      </AppShell>

      <PrototypeAppModals ctx={ctx} />
    </>
  );
}
