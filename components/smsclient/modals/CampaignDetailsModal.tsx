"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BadgeDraft,
  BadgeFailed,
  BadgeScheduled,
  BadgeSent,
} from "@/components/smsclient/ui";
import { cn } from "@/lib/cn";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { groupColor, groupTagBase } from "@/lib/proto/contactDisplay";
import type { CampaignRowData, SmsCampaignStatus } from "@/lib/types/campaign";
import { useState } from "react";
import { Megaphone, Send, Users } from "lucide-react";
import {
  dialogContentZCls,
  dialogOverlayCls,
  formDialogContentCls,
  modalIconCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";

const fieldLabelCls = "text-xs font-semibold text-foreground";

const STATUS_KEYS: Record<SmsCampaignStatus, MessageKey> = {
  sent: "campaigns.status.sent",
  scheduled: "campaigns.status.scheduled",
  draft: "campaigns.status.draft",
  failed: "campaigns.status.failed",
  cancelled: "campaigns.status.cancelled",
};

function StatusBadge({ status }: { status: SmsCampaignStatus }) {
  const { t } = useI18n();
  const label = t(STATUS_KEYS[status]);
  switch (status) {
    case "sent":
      return <BadgeSent>{label}</BadgeSent>;
    case "scheduled":
      return <BadgeScheduled>{label}</BadgeScheduled>;
    case "draft":
      return <BadgeDraft>{label}</BadgeDraft>;
    case "failed":
    case "cancelled":
      return <BadgeFailed>{label}</BadgeFailed>;
    default:
      return <BadgeDraft>—</BadgeDraft>;
  }
}

function DetailField({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className={fieldLabelCls} htmlFor={id}>
        {label}
      </Label>
      <p id={id} className="text-sm text-foreground">
        {value}
      </p>
    </div>
  );
}

type CampaignDetailsModalProps = {
  open: boolean;
  campaign: CampaignRowData | null;
  onClose: () => void;
  onResend?: (campaign: CampaignRowData) => void;
};

export function CampaignDetailsModal({
  open,
  campaign,
  onClose,
  onResend,
}: CampaignDetailsModalProps) {
  const { t } = useI18n();
  const campaignId = campaign?.id ?? null;
  const [section, setSection] = useState<"detail" | "recipients">("detail");
  const [prevId, setPrevId] = useState(campaignId);
  if (campaignId !== prevId) {
    setPrevId(campaignId);
    setSection("detail");
  }

  const hasContacts =
    campaign?.targetContacts && campaign.targetContacts.length > 0;
  const hasGroups =
    campaign?.targetGroups && campaign.targetGroups.length > 0;

  return (
    <Dialog
      open={open && !!campaign}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton
        overlayClassName={dialogOverlayCls}
        className={cn(
          formDialogContentCls,
          "h-[min(86dvh,760px)] max-h-[min(86dvh,760px)] rounded-xl shadow-lg sm:max-w-[640px]",
          dialogContentZCls
        )}
        onOpenAutoFocus={preventDialogOpenAutoFocus}
      >
        {campaign && (
          <>
            <DialogHeader className="shrink-0 flex-row items-center gap-2.5 space-y-0 border-b border-border px-4 py-2.5 text-left">
              <div className={modalIconCls("sm")} aria-hidden>
                <Megaphone />
              </div>
              <DialogTitle className="min-w-0 flex-1 truncate pr-8 text-base font-semibold leading-snug tracking-tight">
                {t("campaigns.details.title")}
                <span className="font-normal text-muted-foreground">
                  {" "}
                  –{" "}
                </span>
                <span className="font-normal">{campaign.name}</span>
              </DialogTitle>
            </DialogHeader>

            <div
              role="tablist"
              aria-label={t("campaigns.details.title")}
              className="flex shrink-0 gap-1 px-6 pt-3"
            >
              <Button
                type="button"
                size="sm"
                role="tab"
                aria-selected={section === "detail"}
                variant={section === "detail" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSection("detail")}
              >
                {t("campaigns.details.sectionDetail")}
              </Button>
              <Button
                type="button"
                size="sm"
                role="tab"
                aria-selected={section === "recipients"}
                variant={section === "recipients" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSection("recipients")}
              >
                {t("campaigns.details.sectionList")}
              </Button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
              {section === "detail" ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className={fieldLabelCls}>
                      {t("campaigns.col.status")}
                    </span>
                    <StatusBadge status={campaign.status} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DetailField
                      id="campaign-detail-created"
                      label={t("campaigns.details.created")}
                      value={campaign.createdLabel}
                    />
                    <DetailField
                      id="campaign-detail-send"
                      label={t("campaigns.col.send")}
                      value={campaign.sendLabel}
                    />
                    <DetailField
                      id="campaign-detail-mode"
                      label={t("campaigns.details.mode")}
                      value={
                        campaign.sendMode === "sched"
                          ? t("campaigns.details.modeSched")
                          : t("campaigns.details.modeNow")
                      }
                    />
                    <DetailField
                      id="campaign-detail-sender"
                      label={t("campaigns.details.sender")}
                      value={campaign.sender?.trim() || "—"}
                    />
                    <DetailField
                      id="campaign-detail-recipients"
                      label={t("campaigns.col.recipients")}
                      value={String(campaign.recipients)}
                    />
                    <DetailField
                      id="campaign-detail-credits"
                      label={t("campaigns.col.credits")}
                      value={campaign.creditsLabel}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      className={fieldLabelCls}
                      htmlFor="campaign-detail-message"
                    >
                      {t("campaigns.details.message")}
                    </Label>
                    <Textarea
                      id="campaign-detail-message"
                      readOnly
                      value={campaign.body?.trim() || "—"}
                      className="min-h-[88px] resize-none bg-muted/40 focus-visible:ring-0"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Users
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden
                    />
                    <span className={fieldLabelCls}>
                      {t("campaigns.details.targeted")}
                    </span>
                  </div>
                  {hasGroups && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {campaign.targetGroups!.map((g) => {
                        const c = groupColor(g);
                        return (
                          <span
                            key={g}
                            className={cn(
                              groupTagBase,
                              c.bg,
                              c.border,
                              c.text
                            )}
                          >
                            {g}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {hasContacts ? (
                    <div className="overflow-hidden rounded-lg border border-border">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 font-medium text-muted-foreground">
                              {t("contacts.col.firstName")}
                            </th>
                            <th className="px-3 py-2 font-medium text-muted-foreground">
                              {t("contacts.col.lastName")}
                            </th>
                            <th className="px-3 py-2 font-medium text-muted-foreground">
                              {t("contacts.col.phone")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaign.targetContacts!.map((c, i) => (
                            <tr
                              key={`${c.phone}-${i}`}
                              className="border-t border-border"
                            >
                              <td className="px-3 py-2 text-foreground">
                                {c.firstName || "—"}
                              </td>
                              <td className="px-3 py-2 text-foreground">
                                {c.lastName || "—"}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {c.phone}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("campaigns.details.noContacts")}
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="mx-0 mb-0 shrink-0 flex-row flex-wrap items-center justify-between gap-2 rounded-b-xl p-2.5 px-4 sm:justify-between">
              {onResend ? (
                <Button
                  type="button"
                  variant="default"
                  className="cursor-pointer"
                  onClick={() => onResend(campaign)}
                >
                  <Send className="h-4 w-4" aria-hidden />
                  {t("campaigns.details.resend")}
                </Button>
              ) : (
                <span />
              )}
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={onClose}
              >
                {t("dialog.close")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
