"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { Gift } from "lucide-react";
import { FormDialogHeader } from "./FormDialogHeader";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";

const TERM_SECTIONS = [
  { titleKey: "parrainage.termsModal.s1.title", bodyKey: "parrainage.termsModal.s1.body" },
  { titleKey: "parrainage.termsModal.s2.title", bodyKey: "parrainage.termsModal.s2.body" },
  { titleKey: "parrainage.termsModal.s3.title", bodyKey: "parrainage.termsModal.s3.body" },
  { titleKey: "parrainage.termsModal.s4.title", bodyKey: "parrainage.termsModal.s4.body" },
  { titleKey: "parrainage.termsModal.s5.title", bodyKey: "parrainage.termsModal.s5.body" },
] as const satisfies ReadonlyArray<{ titleKey: MessageKey; bodyKey: MessageKey }>;

export type ParrainageTermsModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ParrainageTermsModal({ open, onClose }: ParrainageTermsModalProps) {
  const { t } = useI18n();

  return (
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
          "flex max-h-[min(90dvh,720px)] min-h-0 sm:max-w-[560px]",
          dialogContentZCls,
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
      >
        <FormDialogHeader
          className="shrink-0 border-b border-border/60 px-4 py-3"
          icon={<Gift className="size-5 text-primary" strokeWidth={2.25} />}
          title={t("parrainage.termsModal.title")}
          description={t("parrainage.termsModal.subtitle")}
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
            {TERM_SECTIONS.map(({ titleKey, bodyKey }) => (
              <section key={titleKey}>
                <h3 className="mb-1 text-sm font-bold text-foreground">
                  {t(titleKey)}
                </h3>
                <p>{t(bodyKey)}</p>
              </section>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-border/60 px-4 py-3">
          <Button type="button" variant="default" onClick={onClose}>
            {t("parrainage.termsModal.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
