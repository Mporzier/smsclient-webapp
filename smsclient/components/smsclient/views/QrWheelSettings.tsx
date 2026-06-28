"use client";

import { ProtoBtn } from "@/components/smsclient/ui";
import { cn } from "@/lib/cn";
import {
  defaultPercentForNewSegment,
  distributeEqualWheelPercents,
  qrWheelConfigsEqual,
  randomWheelColor,
  randomizeSegmentColors,
  totalWheelWeight,
} from "@/lib/qr/wheelDefaults";
import type { QrWheelConfig, QrWheelSegment } from "@/lib/types/qrWheel";
import {
  CircleX,
  Gift,
  MessageSquare,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

const inp =
  "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#2f6fed]/40 focus:ring-2 focus:ring-[#2f6fed]/10";

type QrWheelSettingsProps = {
  config: QrWheelConfig | null;
  loading: boolean;
  saving: boolean;
  onSave: (config: QrWheelConfig) => Promise<void>;
  onEnableWithDefaults?: () => Promise<void>;
  embedded?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
};

function OptionCard({
  active,
  disabled,
  icon: Icon,
  label,
  description,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: typeof MessageSquare;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-1 cursor-pointer flex-col items-start rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-[#2f6fed]/35 bg-[#eef4ff] shadow-[0_0_0_1px_rgba(47,111,237,0.08)]"
          : "border-slate-200 bg-white hover:border-slate-300",
      )}
    >
      <span
        className={cn(
          "mb-2 grid h-8 w-8 place-items-center rounded-lg border",
          active
            ? "border-[#2f6fed]/20 bg-white text-[#2f6fed]"
            : "border-slate-200 bg-slate-50 text-slate-500",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="text-xs font-black text-slate-900">{label}</span>
      <span className="mt-0.5 text-[10px] font-semibold leading-snug text-slate-500">
        {description}
      </span>
    </button>
  );
}

function emptySegment(order: number, usedColors: string[]): QrWheelSegment {
  return {
    id: `new-${order}-${Date.now()}`,
    sortOrder: order,
    label: "Nouvelle récompense",
    probabilityWeight: 10,
    isLosing: false,
    screenMessage: "Bravo ! Vous avez gagné une récompense.",
    smsMessage: "Félicitations {prenom} ! Présentez ce SMS en boutique.",
    color: randomWheelColor(usedColors),
  };
}

function SegmentOutcomeToggle({
  isLosing,
  disabled,
  onChange,
}: {
  isLosing: boolean;
  disabled?: boolean;
  onChange: (isLosing: boolean) => void;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
      role="group"
      aria-label="Type de case"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(false)}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          !isLosing
            ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200"
            : "text-slate-500 hover:text-slate-700",
        )}
      >
        <Gift className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Récompense
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(true)}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          isLosing
            ? "bg-white text-slate-700 shadow-sm ring-1 ring-slate-300"
            : "text-slate-500 hover:text-slate-700",
        )}
      >
        <CircleX className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Perdu
      </button>
    </div>
  );
}

function ChanceDistributionBar({
  total,
  onDistribute,
  distributing,
}: {
  total: number;
  onDistribute: () => void;
  distributing?: boolean;
}) {
  const complete = total === 100;

  return (
    <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="m-0 text-[11px] font-black text-slate-800">
            Répartition des chances
          </p>
          <p className="m-0 mt-0.5 text-[10px] font-semibold text-slate-500">
            La somme de toutes les cases doit faire 100 %.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-black tabular-nums",
              complete ? "text-emerald-600" : "text-amber-600",
            )}
          >
            {total} / 100 %
          </span>
          <button
            type="button"
            disabled={distributing}
            onClick={onDistribute}
            className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 transition-colors hover:border-[#2f6fed]/30 hover:text-[#2f6fed] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Répartir équitablement
          </button>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            complete ? "bg-emerald-500" : total > 100 ? "bg-rose-500" : "bg-amber-400",
          )}
          style={{ width: `${Math.min(total, 100)}%` }}
        />
      </div>
      {!complete ? (
        <p className="m-0 mt-2 text-[10px] font-semibold text-amber-700">
          {total < 100
            ? `Il reste ${100 - total} % à attribuer entre les cases.`
            : `Retirez ${total - 100} % : la somme dépasse 100 %.`}
        </p>
      ) : null}
    </div>
  );
}

export function QrWheelSettings({
  config,
  loading,
  saving,
  onSave,
  embedded = false,
  onDirtyChange,
}: QrWheelSettingsProps) {
  const [draft, setDraft] = useState<QrWheelConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config) setDraft(structuredClone(config));
  }, [config]);

  useEffect(() => {
    if (!onDirtyChange || !config || !draft) {
      onDirtyChange?.(false);
      return;
    }
    const baseline = embedded ? { ...config, enabled: true } : config;
    const current = embedded ? { ...draft, enabled: true } : draft;
    onDirtyChange(!qrWheelConfigsEqual(baseline, current));
  }, [config, draft, embedded, onDirtyChange]);

  if (loading || !draft) {
    return (
      <div className="grid min-h-[200px] place-items-center text-sm font-bold text-slate-500">
        Chargement de la roue…
      </div>
    );
  }

  const weightTotal = totalWheelWeight(draft.segments);
  const usedColors = draft.segments.map((segment) => segment.color);

  function updateSegment(index: number, patch: Partial<QrWheelSegment>) {
    setDraft((current) => {
      if (!current) return current;
      const segments = [...current.segments];
      segments[index] = { ...segments[index], ...patch };
      return { ...current, segments };
    });
  }

  async function handleSave() {
    if (!draft) return;
    setError(null);

    const payload: QrWheelConfig = embedded
      ? { ...draft, enabled: true }
      : draft;

    if (payload.segments.length === 0) {
      setError("Ajoutez au moins une case sur la roue.");
      return;
    }
    if (payload.enabled && weightTotal !== 100) {
      setError(
        `La somme des chances doit être égale à 100 %. Actuellement : ${weightTotal} %.`,
      );
      return;
    }

    const invalidLabel = payload.segments.find((s) => !s.label.trim());
    if (invalidLabel) {
      setError("Chaque case doit avoir un libellé.");
      return;
    }

    try {
      await onSave(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur à l'enregistrement.");
    }
  }

  const form = (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <h4 className="m-0 mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
          Affichage client
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-600">
              Titre
            </label>
            <input
              className={inp}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Tournez la roue !"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-600">
              Sous-titre
            </label>
            <input
              className={inp}
              value={draft.subtitle}
              onChange={(e) =>
                setDraft({ ...draft, subtitle: e.target.value })
              }
              placeholder="Tentez votre chance après inscription"
            />
          </div>
        </div>
      </section>

      <section>
        <h4 className="m-0 mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
          Options
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">
          <OptionCard
            active={draft.sendPrizeSms}
            disabled={saving}
            icon={MessageSquare}
            label="SMS de gain"
            description="Envoie automatiquement le gain par SMS au client."
            onClick={() =>
              setDraft({ ...draft, sendPrizeSms: !draft.sendPrizeSms })
            }
          />
          <OptionCard
            active={draft.allowRepeat}
            disabled={saving}
            icon={Users}
            label="Participations multiples"
            description="Autorise le même numéro à rejouer."
            onClick={() =>
              setDraft({ ...draft, allowRepeat: !draft.allowRepeat })
            }
          />
        </div>
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="m-0 text-[11px] font-black uppercase tracking-wide text-slate-500">
              Cases de la roue
            </h4>
            <p className="m-0 mt-0.5 text-[10px] font-semibold text-slate-500">
              Définissez chaque case, son type et sa chance d&apos;apparition.
            </p>
          </div>
          <button
            type="button"
            disabled={saving || draft.segments.length === 0}
            onClick={() =>
              setDraft({
                ...draft,
                segments: randomizeSegmentColors(draft.segments),
              })
            }
            className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-600 transition-colors hover:border-[#2f6fed]/30 hover:text-[#2f6fed] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className="h-3 w-3" aria-hidden />
            Couleurs aléatoires
          </button>
        </div>

        <ChanceDistributionBar
          total={weightTotal}
          distributing={saving}
          onDistribute={() =>
            setDraft({
              ...draft,
              segments: distributeEqualWheelPercents(draft.segments),
            })
          }
        />

        <div className="space-y-3">
          {draft.segments.map((seg, i) => (
            <div
              key={seg.id}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0_4px_12px_rgba(15,23,42,0.04)]"
            >
              <div className="mb-3 flex items-start gap-2">
                <span
                  className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white shadow-sm"
                  style={{ backgroundColor: seg.color }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-[10px] font-bold text-slate-500">
                    Libellé affiché sur la roue
                  </label>
                  <input
                    className={inp}
                    value={seg.label}
                    onChange={(e) => updateSegment(i, { label: e.target.value })}
                    placeholder="Ex : 10 % de réduction"
                  />
                </div>
                <button
                  type="button"
                  className="mt-6 grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-rose-200 text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Supprimer la case"
                  disabled={saving}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      segments: draft.segments.filter((_, j) => j !== i),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-slate-500">
                    Type de case
                  </label>
                  <SegmentOutcomeToggle
                    isLosing={seg.isLosing}
                    disabled={saving}
                    onChange={(isLosing) => {
                      updateSegment(i, {
                        isLosing,
                        smsMessage: isLosing ? "" : seg.smsMessage,
                        screenMessage: isLosing
                          ? "Pas de chance cette fois… Retentez votre chance !"
                          : seg.screenMessage,
                      });
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`wheel-chance-${seg.id}`}
                    className="mb-1 block text-[10px] font-bold text-slate-500"
                  >
                    Chance d&apos;apparition
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`wheel-chance-${seg.id}`}
                      type="range"
                      min={1}
                      max={100}
                      disabled={saving}
                      value={seg.probabilityWeight}
                      onChange={(e) =>
                        updateSegment(i, {
                          probabilityWeight: Number(e.target.value),
                        })
                      }
                      className="min-w-0 flex-1 accent-[#2f6fed]"
                    />
                    <div className="flex shrink-0 items-center gap-0.5">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        disabled={saving}
                        className={cn(inp, "w-14 px-2 text-center tabular-nums")}
                        value={seg.probabilityWeight}
                        onChange={(e) =>
                          updateSegment(i, {
                            probabilityWeight: Math.min(
                              100,
                              Math.max(1, Number(e.target.value) || 1),
                            ),
                          })
                        }
                      />
                      <span className="text-[11px] font-bold text-slate-500">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold text-slate-500">
                    Message affiché après le tirage
                  </label>
                  <input
                    className={inp}
                    value={seg.screenMessage}
                    onChange={(e) =>
                      updateSegment(i, { screenMessage: e.target.value })
                    }
                    placeholder={
                      seg.isLosing
                        ? "Ex : Pas de chance cette fois…"
                        : "Ex : Bravo ! Vous avez gagné…"
                    }
                  />
                </div>
                {!seg.isLosing ? (
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-slate-500">
                      SMS envoyé au client
                    </label>
                    <input
                      className={inp}
                      value={seg.smsMessage}
                      onChange={(e) =>
                        updateSegment(i, { smsMessage: e.target.value })
                      }
                      placeholder="Ex : Félicitations {prenom} ! Présentez ce SMS en boutique."
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <ProtoBtn
          className="mt-3 h-9 w-full text-xs"
          disabled={saving}
          onClick={() => {
            const next = emptySegment(draft.segments.length, usedColors);
            next.probabilityWeight = defaultPercentForNewSegment(draft.segments);
            setDraft({
              ...draft,
              segments: [...draft.segments, next],
            });
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Ajouter une case
        </ProtoBtn>
      </section>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
          {error}
        </p>
      ) : null}
    </div>
  );

  if (embedded) {
    return (
      <div className="flex min-h-0 flex-col">
        <div className="min-h-0 flex-1">{form}</div>
        <div className="sticky bottom-0 mt-4 border-t border-slate-100 bg-white pt-3">
          <ProtoBtn
            primary
            className="h-10 w-full text-sm"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </ProtoBtn>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
      {form}
      <ProtoBtn
        primary
        className="mt-4 w-full"
        disabled={saving}
        onClick={() => void handleSave()}
      >
        {saving ? "Enregistrement…" : "Enregistrer la roue"}
      </ProtoBtn>
    </div>
  );
}
