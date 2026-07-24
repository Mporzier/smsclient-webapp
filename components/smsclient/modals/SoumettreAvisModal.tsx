"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { FormDialogShell } from "@/components/smsclient/modals/FormDialogShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { submitUserFeedback } from "@/lib/supabase/feedback";
import type { FeedbackCategory } from "@/lib/types/feedback";
import {
  Bug,
  Info,
  Lock,
  MoreHorizontal,
  NotebookPen,
  PenLine,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

const MAX_LENGTH = 2000;

const CATEGORIES: {
  id: FeedbackCategory;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "suggestion", label: "Suggestion", icon: PenLine },
  { id: "technical", label: "Problème technique", icon: Bug },
  { id: "improvement", label: "Amélioration", icon: TrendingUp },
  { id: "feature", label: "Fonctionnalité", icon: Sparkles },
  { id: "other", label: "Autre", icon: MoreHorizontal },
];

type SoumettreAvisModalProps = {
  open: boolean;
  onClose: () => void;
  onToast?: (message: string) => void;
};

export function SoumettreAvisModal({
  open,
  onClose,
  onToast,
}: SoumettreAvisModalProps) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [category, setCategory] = useState<FeedbackCategory>("suggestion");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(false);

  if (open && !wasOpen) {
    setWasOpen(true);
    setCategory("suggestion");
    setMessage("");
    setSubmitting(false);
    setSubmitError(null);
  }
  if (!open && wasOpen) {
    setWasOpen(false);
  }

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [onClose, submitting]);

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);

    if (!message.trim()) {
      setSubmitError("Décrivez votre avis avant d'envoyer.");
      return;
    }
    if (!user?.id) {
      setSubmitError("Connectez-vous pour envoyer un avis.");
      return;
    }

    setSubmitting(true);
    const { error } = await submitUserFeedback(supabase, user.id, {
      category,
      message,
    });
    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      onToast?.(error.message);
      return;
    }

    onToast?.("Merci, votre avis a bien été envoyé.");
    onClose();
  }, [category, message, user, supabase, onToast, onClose]);

  return (
    <FormDialogShell
      open={open}
      onClose={handleClose}
      title="Soumettre un avis"
      description="Votre retour nous aide à améliorer smsclient.fr"
      icon={<NotebookPen className="size-4" aria-hidden />}
      onSave={handleSubmit}
      saving={submitting}
      saveLabel="Envoyer l'avis"
    >
      {submitError ? (
        <p className="m-0 mb-4 text-xs font-bold text-destructive" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">Catégorie</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((item) => {
              const selected = category === item.id;
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant={selected ? "secondary" : "outline"}
                  aria-pressed={selected}
                  className="h-auto flex-col gap-1.5 px-2 py-3"
                  onClick={() => {
                    setCategory(item.id);
                    setSubmitError(null);
                  }}
                >
                  <Icon className="size-4" aria-hidden />
                  <span className="text-[11px] leading-snug whitespace-normal">
                    {item.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <Textarea
            id="feedback-message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value.slice(0, MAX_LENGTH));
              setSubmitError(null);
            }}
            placeholder="Décrivez votre avis, votre idée, ou le problème rencontré…"
            rows={6}
            aria-label="Votre avis"
            className="min-h-[140px] resize-none pb-7"
          />
          <p
            className={cn(
              "pointer-events-none absolute bottom-2.5 right-3 m-0 text-[10px] font-semibold tabular-nums text-muted-foreground",
            )}
            aria-hidden
          >
            {message.length}/{MAX_LENGTH}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Info
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <p className="m-0 text-[11px] font-medium leading-snug text-muted-foreground">
              Nous lisons tous les avis et y répondons si nécessaire.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <p className="m-0 text-[11px] font-medium leading-snug text-muted-foreground">
              Aucune donnée personnelle n&apos;est collectée
            </p>
          </div>
        </div>
      </div>
    </FormDialogShell>
  );
}
