"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/lib/i18n";
import type { TrashRestoreResult } from "@/lib/types/trash";
import {
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";
import {
  confirmAlertContentCls,
  confirmCardBlueCls,
  confirmCardBlueIconCls,
  confirmCardDestructiveCls,
  confirmCardDestructiveIconCls,
  confirmCardEmeraldCls,
  confirmCardEmeraldIconCls,
  confirmDialogMediaEmeraldCls,
  confirmDialogMediaPrimaryCls,
  ConfirmDialogHeader,
  ConfirmInfoCard,
} from "./ConfirmInfoCard";
import { dialogOverlayStackedCls } from "./modalChrome";

type TrashRestoreModalProps = {
  open: boolean;
  kind: "contacts" | "groups";
  count: number;
  onConfirm: () => Promise<TrashRestoreResult>;
  onClose: () => void;
};

type Phase = "confirm" | "loading" | "summary";

function RestoreSummaryTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <span className="block">
      <span className="block">{title}</span>
      <span className="mt-0.5 block text-sm font-normal leading-snug text-muted-foreground">
        {subtitle}
      </span>
    </span>
  );
}

export function TrashRestoreModal({
  open,
  kind,
  count,
  onConfirm,
  onClose,
}: TrashRestoreModalProps) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>("confirm");
  const [result, setResult] = useState<TrashRestoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setPhase("confirm");
      setResult(null);
      setError(null);
    }
  }

  const isContacts = kind === "contacts";

  const handleConfirm = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      setResult(await onConfirm());
      setPhase("summary");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("trash.restoreFailed"));
      setPhase("confirm");
    }
  }, [onConfirm, t]);

  const confirmTitle = isContacts
    ? t(
        count === 1
          ? "trash.restoreConfirmContact"
          : "trash.restoreConfirmContacts",
        { n: count },
      )
    : t(
        count === 1
          ? "trash.restoreConfirmGroup"
          : "trash.restoreConfirmGroups",
        { n: count },
      );

  const restoredLabel = (n: number) =>
    isContacts
      ? t(n === 1 ? "trash.restoredContact" : "trash.restoredContacts", { n })
      : t(n === 1 ? "trash.restoredGroup" : "trash.restoredGroups", { n });

  const duplicatesLabel = (n: number) =>
    isContacts
      ? t(n === 1 ? "trash.duplicateContact" : "trash.duplicateContacts", { n })
      : t(n === 1 ? "trash.duplicateGroup" : "trash.duplicateGroups", { n });

  const restored = result?.restored ?? 0;
  const duplicates = result?.duplicates ?? 0;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && phase !== "loading") onClose();
      }}
    >
      <AlertDialogContent
        overlayClassName={dialogOverlayStackedCls}
        className={confirmAlertContentCls(true)}
        onOutsideDismiss={() => {
          if (phase !== "loading") onClose();
        }}
        onEscapeKeyDown={(e) => {
          if (phase === "loading") e.preventDefault();
        }}
      >
        <ConfirmDialogHeader
          title={
            phase === "loading" ? (
              t("trash.restoring")
            ) : phase === "summary" ? (
              <RestoreSummaryTitle
                title={t("trash.restoreDoneTitle")}
                subtitle={t("trash.restoreSummaryDesc")}
              />
            ) : (
              confirmTitle
            )
          }
          media={
            phase === "loading" ? (
              <Spinner className="size-6" />
            ) : phase === "summary" ? (
              <CheckCircle2 aria-hidden />
            ) : (
              <RotateCcw aria-hidden />
            )
          }
          mediaClassName={
            phase === "summary"
              ? confirmDialogMediaEmeraldCls
              : phase === "loading"
                ? confirmDialogMediaPrimaryCls
                : cn(confirmCardBlueCls, "rounded-full", confirmCardBlueIconCls)
          }
          description={
            phase === "loading" ? t("trash.restoreLoadingDesc") : undefined
          }
        >
          {phase === "confirm" ? (
            <ConfirmInfoCard
              icon={ListChecks}
              iconClassName={confirmCardBlueIconCls}
              className={confirmCardBlueCls}
              title="Retour dans vos listes"
            >
              {t("trash.restoreConfirmDesc")}
            </ConfirmInfoCard>
          ) : null}
        </ConfirmDialogHeader>

        {phase === "summary" && (
          <div className="flex flex-col gap-2">
            {restored > 0 && (
              <Alert
                className={cn(
                  "border-emerald-200 dark:border-emerald-500/30",
                  confirmCardEmeraldCls,
                  confirmCardEmeraldIconCls,
                )}
              >
                <CheckCircle2 className={confirmCardEmeraldIconCls} aria-hidden />
                <AlertTitle>{restoredLabel(restored)}</AlertTitle>
              </Alert>
            )}
            {duplicates > 0 && (
              <Alert
                className={cn(
                  "border-destructive/30 text-foreground dark:border-destructive/30",
                  confirmCardDestructiveCls,
                )}
              >
                <AlertTriangle
                  className={cn(confirmCardDestructiveIconCls, "!text-destructive")}
                  aria-hidden
                />
                <AlertTitle className="text-destructive">
                  {duplicatesLabel(duplicates)}
                </AlertTitle>
                <AlertDescription className="text-foreground">
                  {isContacts
                    ? t("trash.duplicateContactsHint")
                    : t("trash.duplicateGroupsHint")}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}

        {phase !== "loading" && (
          <AlertDialogFooter>
            {phase === "summary" ? (
              <Button
                type="button"
                variant="default"
                onClick={onClose}
                className="cursor-pointer"
              >
                {t("dialog.close")}
              </Button>
            ) : (
              <>
                <AlertDialogCancel className="cursor-pointer">
                  {t("common.cancel")}
                </AlertDialogCancel>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => void handleConfirm()}
                  className="cursor-pointer"
                >
                  {t("trash.restore")}
                </Button>
              </>
            )}
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
