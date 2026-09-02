"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/lib/i18n";
import type { TrashRestoreResult } from "@/lib/types/trash";
import { AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { useCallback, useState } from "react";
import {
  dialogContentStackedZCls,
  dialogOverlayStackedCls,
} from "./modalChrome";

type TrashRestoreModalProps = {
  open: boolean;
  kind: "contacts" | "groups";
  count: number;
  onConfirm: () => Promise<TrashRestoreResult>;
  onClose: () => void;
};

type Phase = "confirm" | "loading" | "summary";

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

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && phase !== "loading") onClose();
      }}
    >
      <AlertDialogContent
        overlayClassName={dialogOverlayStackedCls}
        className={dialogContentStackedZCls}
        onOutsideDismiss={() => {
          if (phase !== "loading") onClose();
        }}
        onEscapeKeyDown={(e) => {
          if (phase === "loading") e.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogMedia
            className={
              phase === "summary"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                : "bg-primary/10 text-primary dark:bg-primary/20"
            }
          >
            {phase === "loading" ? (
              <Spinner className="size-6" />
            ) : phase === "summary" ? (
              <CheckCircle2 aria-hidden />
            ) : (
              <RotateCcw aria-hidden />
            )}
          </AlertDialogMedia>
          <AlertDialogTitle>
            {phase === "loading"
              ? t("trash.restoring")
              : phase === "summary"
                ? t("trash.restoreDoneTitle")
                : confirmTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {phase === "loading"
              ? t("trash.restoreLoadingDesc")
              : phase === "summary"
                ? t("trash.restoreSummaryDesc")
                : t("trash.restoreConfirmDesc")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {phase === "summary" && (
          <div className="flex flex-col gap-2">
            {(result?.restored ?? 0) > 0 && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                <CheckCircle2 aria-hidden />
                <AlertTitle>{restoredLabel(result?.restored ?? 0)}</AlertTitle>
              </Alert>
            )}
            {(result?.duplicates ?? 0) > 0 && (
              <Alert variant="destructive">
                <AlertTriangle aria-hidden />
                <AlertTitle>
                  {duplicatesLabel(result?.duplicates ?? 0)}
                </AlertTitle>
                <AlertDescription>
                  {isContacts
                    ? t("trash.duplicateContactsHint")
                    : t("trash.duplicateGroupsHint")}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

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
