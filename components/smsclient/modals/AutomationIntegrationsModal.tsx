"use client";

import { SoumettreAvisModal } from "@/components/smsclient/modals/SoumettreAvisModal";
import { IntegrationsList } from "@/components/smsclient/views/automatisations/IntegrationsList";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import type { CatalogIntegration } from "@/lib/automations/catalog";
import { cn } from "@/lib/cn";
import type { FeedbackCategory } from "@/lib/types/feedback";
import { Wrench } from "lucide-react";
import { useState } from "react";
import { FormDialogHeader } from "./FormDialogHeader";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";

export type AutomationIntegrationsModalProps = {
  open: boolean;
  onClose: () => void;
};

type FeedbackPreset = {
  category: FeedbackCategory;
  message: string;
};

export function AutomationIntegrationsModal({
  open,
  onClose,
}: AutomationIntegrationsModalProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackPreset, setFeedbackPreset] = useState<FeedbackPreset | null>(
    null,
  );

  function handleSelect(integration: CatalogIntegration) {
    if (integration.status === "available") {
      toast(`Connexion ${integration.label} (à implémenter).`);
      return;
    }
    openFeedbackPreset({
      category: "feature",
      message: `Je souhaite connecter le CRM ${integration.label} à SmsClient.\n\n`,
    });
  }

  function closeFeedback() {
    setFeedbackOpen(false);
    setFeedbackPreset(null);
  }

  function openFeedbackPreset(preset: FeedbackPreset) {
    setFeedbackPreset(preset);
    onClose();
    setFeedbackOpen(true);
  }

  function handleRequestCustom() {
    openFeedbackPreset({
      category: "feature",
      message:
        "Je souhaite connecter un outil qui n'est pas dans la liste :\n\n",
    });
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
      >
        <DialogContent
          showCloseButton
          overlayClassName={dialogOverlayCls}
          className={cn(
            formDialogContentCls,
            "flex max-h-[min(90dvh,720px)] min-h-0 sm:max-w-[640px]",
            dialogContentZCls,
          )}
          onOpenAutoFocus={preventDialogOpenAutoFocus}
        >
          <FormDialogHeader
            className="shrink-0 px-4 py-3"
            bareIcon
            icon={
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-gradient-to-br from-violet-50 to-indigo-50 text-violet-700">
                <Wrench className="h-5 w-5" strokeWidth={2.25} />
              </div>
            }
            title="Connecter un outil"
            description="CRM compatibles avec SmsClient — connexion sur demande, adaptée à votre activité."
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/50 px-4 py-3">
            <IntegrationsList
              onSelect={handleSelect}
              onRequestCustom={handleRequestCustom}
            />
          </div>
        </DialogContent>
      </Dialog>

      <SoumettreAvisModal
        open={feedbackOpen}
        onClose={closeFeedback}
        initialCategory={feedbackPreset?.category}
        initialMessage={feedbackPreset?.message}
      />
    </>
  );
}
