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
        onNewCampaign={() => ctx.wizard.openCampaignComposer()}
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

      {ctx.modals.toast && (
        <div
          className="fixed bottom-[18px] right-[18px] z-[10000] rounded-2xl bg-slate-900 px-3.5 py-3 text-sm font-extrabold text-white shadow-[0_18px_40px_rgba(15,23,42,0.35)]"
          role="status"
        >
          {ctx.modals.toast}
        </div>
      )}
    </>
  );
}
