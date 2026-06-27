"use client";

import { ProtoBtn } from "@/components/smsclient/ui";
import { cn } from "@/lib/cn";
import {
  qrWheelConfigsEqual,
  randomWheelColor,
  randomizeSegmentColors,
  totalWheelWeight,
} from "@/lib/qr/wheelDefaults";
import type { QrWheelConfig, QrWheelSegment } from "@/lib/types/qrWheel";
import { MessageSquare, Plus, RefreshCw, Trash2, Users } from "lucide-react";
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
    screenMessage: "",
    smsMessage: "",
    color: randomWheelColor(usedColors),
  };
}

function segmentChance(weight: number, total: number): string {
  if (total <= 0) return "0 %";
  return `${Math.round((weight / total) * 100)} %`;
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
      setError("Ajoutez au moins une récompense.");
      return;
    }
    if (payload.enabled && weightTotal <= 0) {
      setError("Les probabilités doivent être supérieures à 0.");
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
          <h4 className="m-0 text-[11px] font-black uppercase tracking-wide text-slate-500">
            Récompenses
          </h4>
          <div className="flex items-center gap-1.5">
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
            <span className="text-[10px] font-semibold text-slate-400">
              Total probabilités : {weightTotal}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {draft.segments.map((seg, i) => (
            <div
              key={seg.id}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0_4px_12px_rgba(15,23,42,0.04)]"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white shadow-sm"
                  style={{ backgroundColor: seg.color }}
                  title="Couleur aléatoire"
                  aria-hidden
                />
                <input
                  className={cn(inp, "min-w-[120px] flex-1")}
                  value={seg.label}
                  onChange={(e) => updateSegment(i, { label: e.target.value })}
                  placeholder="Libellé sur la roue"
                />
                <div className="flex shrink-0 items-center gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500">
                    Poids
                  </label>
                  <input
                    type="number"
                    min={1}
                    className={cn(inp, "w-16 px-2 text-center")}
                    value={seg.probabilityWeight}
                    onChange={(e) =>
                      updateSegment(i, {
                        probabilityWeight: Math.max(
                          1,
                          Number(e.target.value) || 1,
                        ),
                      })
                    }
                  />
                  <span className="w-8 text-right text-[10px] font-bold tabular-nums text-[#2f6fed]">
                    {segmentChance(seg.probabilityWeight, weightTotal)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateSegment(i, { isLosing: !seg.isLosing })}
                  className={cn(
                    "h-9 shrink-0 rounded-lg border px-2.5 text-[10px] font-bold transition-colors",
                    seg.isLosing
                      ? "border-slate-300 bg-slate-100 text-slate-600"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700",
                  )}
                >
                  {seg.isLosing ? "Perdant" : "Gagnant"}
                </button>
                <button
                  type="button"
                  className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-rose-200 text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Supprimer la récompense"
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
              <input
                className={cn(inp, "mb-2")}
                value={seg.screenMessage}
                onChange={(e) =>
                  updateSegment(i, { screenMessage: e.target.value })
                }
                placeholder="Message affiché à l'écran après le tirage"
              />
              {!seg.isLosing ? (
                <input
                  className={inp}
                  value={seg.smsMessage}
                  onChange={(e) =>
                    updateSegment(i, { smsMessage: e.target.value })
                  }
                  placeholder="SMS du gain (utilisez {prenom})"
                />
              ) : null}
            </div>
          ))}
        </div>

        <ProtoBtn
          className="mt-2 h-9 w-full text-xs"
          disabled={saving}
          onClick={() =>
            setDraft({
              ...draft,
              segments: [
                ...draft.segments,
                emptySegment(draft.segments.length, usedColors),
              ],
            })
          }
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Ajouter une récompense
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
