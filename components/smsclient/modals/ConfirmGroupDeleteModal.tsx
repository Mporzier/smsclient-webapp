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
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
  CircleUserRound,
  RotateCcw,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import {
  dialogContentStackedZCls,
  dialogContentZCls,
  dialogOverlayCls,
  dialogOverlayStackedCls,
} from "./modalChrome";

type ConfirmGroupDeleteModalProps = {
  open: boolean;
  count: number;
  /** Titre « Supprimer ce groupe ? » (modale édition) vs « Supprimer N groupe(s) ? » (liste). */
  fromEdit?: boolean;
  /** Au-dessus d'une autre modale (ex. édition de groupe). */
  stacked?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

function InfoCard({
  icon: Icon,
  className,
  iconClassName,
  title,
  children,
}: {
  icon: LucideIcon;
  className: string;
  iconClassName?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-xl p-3",
        className
      )}
    >
      <Icon className={cn("h-6 w-6 shrink-0", iconClassName)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-snug">{title}</p>
        <div className="mt-0.5 text-xs leading-snug">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmGroupDeleteModal({
  open,
  count,
  fromEdit = false,
  stacked = false,
  onConfirm,
  onCancel,
}: ConfirmGroupDeleteModalProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setLoading(false);
      setError(null);
    }
  }

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.errorOccurred"));
      setLoading(false);
    }
  }, [onConfirm, t]);

  const title = fromEdit
    ? "Supprimer ce groupe ?"
    : count === 1
    ? "Supprimer 1 groupe ?"
    : `Supprimer ${count} groupes ?`;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !loading) onCancel();
      }}
    >
      <AlertDialogContent
        overlayClassName={stacked ? dialogOverlayStackedCls : dialogOverlayCls}
        className={cn(
          "!max-w-md sm:!max-w-md",
          stacked ? dialogContentStackedZCls : dialogContentZCls
        )}
        onOutsideDismiss={() => {
          if (!loading) onCancel();
        }}
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogMedia className="rounded-full bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Trash2 aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-2.5 pt-1 text-foreground">
              <InfoCard
                icon={CircleUserRound}
                iconClassName="text-destructive dark:text-destructive"
                className="bg-destructive/10 text-foreground dark:bg-destructive/20"
                title="Les contacts ne seront pas supprimés"
              >
                Ils resteront disponibles dans votre répertoire.
              </InfoCard>
              <InfoCard
                icon={RotateCcw}
                iconClassName="text-[#2f6fed] dark:text-primary"
                className="bg-[#eef4ff] text-foreground dark:bg-primary/10"
                title="Restauration possible"
              >
                {count === 1 ? (
                  <>
                    Vous pouvez le restaurer à tout moment dans
                    <br />
                    <span className="font-bold text-[#2f6fed] dark:text-primary">
                      Paramètres → Corbeille
                    </span>
                  </>
                ) : (
                  <>
                    Vous pouvez les restaurer à tout moment dans
                    <br />
                    <span className="font-bold text-[#2f6fed] dark:text-primary">
                      Paramètres → Corbeille
                    </span>
                  </>
                )}
              </InfoCard>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="cursor-pointer">
            {t("common.cancel")}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={() => void handleConfirm()}
            className="cursor-pointer"
          >
            {loading ? t("common.deleting") : t("common.delete")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
