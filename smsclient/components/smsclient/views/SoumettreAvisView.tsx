"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { fieldBox } from "@/components/smsclient/flowFieldStyles";
import { ProtoBtn } from "@/components/smsclient/ui";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { submitUserFeedback } from "@/lib/supabase/feedback";
import type { FeedbackCategory } from "@/lib/types/feedback";
import {
  CheckCircle2,
  Lightbulb,
  MessageSquareText,
  MoreHorizontal,
  Sparkles,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

const MAX_LENGTH = 2000;

const CATEGORIES: {
  id: FeedbackCategory;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "suggestion", label: "Suggestion", icon: Lightbulb },
  { id: "technical", label: "Problème technique", icon: Wrench },
  { id: "improvement", label: "Amélioration", icon: TrendingUp },
  { id: "feature", label: "Fonctionnalité", icon: Sparkles },
  { id: "other", label: "Autre", icon: MoreHorizontal },
];

type SoumettreAvisViewProps = {
  onToast?: (message: string) => void;
};

export function SoumettreAvisView({ onToast }: SoumettreAvisViewProps) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [category, setCategory] = useState<FeedbackCategory>("suggestion");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    setSubmitSuccess(false);

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

    setMessage("");
    setCategory("suggestion");
    setSubmitSuccess(true);
    onToast?.("Merci, votre avis a bien été envoyé.");
  }, [category, message, user?.id, supabase, onToast]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className={cn(fieldBox, "mx-auto w-full max-w-[640px] py-5")}>
        <div className="mb-5 flex items-start gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#2f6fed]/20 bg-[#eef4ff] text-[#2f6fed]">
            <MessageSquareText className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="m-0 text-base font-black leading-snug text-slate-900">
              Soumettre un avis
            </h1>
            <p className="m-0 mt-1 text-xs font-semibold leading-snug text-slate-500">
              Votre retour nous aide à améliorer smsclient.fr
            </p>
          </div>
        </div>

        {submitSuccess ? (
          <div
            className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5"
            role="status"
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
              aria-hidden
            />
            <p className="m-0 text-xs font-semibold leading-snug text-emerald-900">
              Merci ! Votre avis a bien été enregistré. Nous le lirons avec
              attention.
            </p>
          </div>
        ) : null}

        {submitError ? (
          <p className="m-0 mb-4 text-xs font-bold text-rose-700" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="mb-4">
          <p className="m-0 mb-2 text-xs font-black text-slate-800">Catégorie</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((item) => {
              const selected = category === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCategory(item.id);
                    setSubmitError(null);
                    setSubmitSuccess(false);
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors",
                    selected
                      ? "border-[#2f6fed] bg-[#eef4ff] shadow-[inset_0_0_0_1px_rgba(47,111,237,0.12)]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-lg border",
                      selected
                        ? "border-[#2f6fed]/25 bg-white text-[#2f6fed]"
                        : "border-slate-200 bg-slate-50 text-slate-500",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-bold leading-snug",
                      selected ? "text-[#1f3b77]" : "text-slate-700",
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-2">
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value.slice(0, MAX_LENGTH));
              setSubmitError(null);
              setSubmitSuccess(false);
            }}
            placeholder="Décrivez votre avis, votre idée, ou le problème rencontré…"
            rows={6}
            aria-label="Votre avis"
            className="w-full resize-none rounded-xl border border-[#dfe6f2] bg-transparent px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#2f6fed]/40 focus:ring-2 focus:ring-[#2f6fed]/15"
          />
          <p className="m-0 mt-1.5 text-right text-[10px] font-semibold tabular-nums text-slate-400">
            {message.length}/{MAX_LENGTH}
          </p>
        </div>

        <p className="m-0 text-[11px] font-semibold leading-snug text-slate-500">
          Nous lisons tous les avis et y répondons si nécessaire.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 max-w-[280px] text-[10px] font-semibold leading-snug text-slate-500">
            Aucune donnée personnelle n&apos;est collectée
          </p>
          <ProtoBtn
            primary
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? "Envoi…" : "Envoyer"}
          </ProtoBtn>
        </div>
      </div>
    </div>
  );
}
