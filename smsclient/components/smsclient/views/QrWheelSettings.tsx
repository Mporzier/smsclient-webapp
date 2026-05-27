"use client";

import { ProtoBtn } from "@/components/smsclient/ui";
import { cn } from "@/lib/cn";
import { totalWheelWeight } from "@/lib/qr/wheelDefaults";
import type { QrWheelConfig, QrWheelSegment } from "@/lib/types/qrWheel";
import { Gift, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const inp =
  "h-10 w-full rounded-xl border border-slate-300/50 bg-transparent px-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500";

type QrWheelSettingsProps = {
  config: QrWheelConfig | null;
  loading: boolean;
  saving: boolean;
  onSave: (config: QrWheelConfig) => Promise<void>;
  onEnableWithDefaults: () => Promise<void>;
};

function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={cn(
            "relative h-7 w-12 rounded-full border transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5 peer-disabled:opacity-50",
            checked
              ? "border-[#2f6fed] bg-[#2f6fed]"
              : "border-slate-300 bg-slate-200",
          )}
          aria-hidden
        />
      </span>
    </label>
  );
}

function emptySegment(order: number): QrWheelSegment {
  return {
    id: `new-${order}`,
    sortOrder: order,
    label: "Nouvelle récompense",
    probabilityWeight: 10,
    isLosing: false,
    screenMessage: "",
    smsMessage: "",
    color: "#4a86ff",
  };
}

export function QrWheelSettings({
  config,
  loading,
  saving,
  onSave,
  onEnableWithDefaults,
}: QrWheelSettingsProps) {
  const [draft, setDraft] = useState<QrWheelConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config) setDraft(structuredClone(config));
  }, [config]);

  if (loading || !draft) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-500">
        Chargement de la roue…
      </div>
    );
  }

  const weightTotal = totalWheelWeight(draft.segments);

  function updateSegment(index: number, patch: Partial<QrWheelSegment>) {
    setDraft((d) => {
      if (!d) return d;
      const segments = [...d.segments];
      segments[index] = { ...segments[index], ...patch };
      return { ...d, segments };
    });
  }

  async function handleSave() {
    if (!draft) return;
    setError(null);
    if (draft.enabled && draft.segments.length === 0) {
      setError("Ajoute au moins une récompense.");
      return;
    }
    if (draft.enabled && weightTotal <= 0) {
      setError("Les probabilités doivent être supérieures à 0.");
      return;
    }
    try {
      await onSave(draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur à l'enregistrement.");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
      <div className="flex items-start gap-3">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#dfe6f2] bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600"
          aria-hidden
        >
          <Gift className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <Toggle
            label="Roue des récompenses"
            checked={draft.enabled}
            disabled={saving}
            onChange={async (enabled) => {
              if (enabled && draft.segments.length === 0) {
                try {
                  await onEnableWithDefaults();
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Activation impossible.",
                  );
                }
              } else {
                setDraft({ ...draft, enabled });
              }
            }}
          />
          <p className="mt-1.5 text-sm font-semibold text-slate-600">
            Après inscription, le client peut tourner la roue (avec consentement
            SMS obligatoire).
          </p>
        </div>
      </div>

      {draft.enabled && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-black text-slate-600">
                Titre affiché
              </label>
              <input
                className={inp}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-slate-600">
                Sous-titre
              </label>
              <input
                className={inp}
                value={draft.subtitle}
                onChange={(e) =>
                  setDraft({ ...draft, subtitle: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-black text-slate-600">
                Validité du gain (jours)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                className={inp}
                value={draft.prizeValidityDays}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    prizeValidityDays: Number(e.target.value) || 30,
                  })
                }
              />
            </div>
            <div className="flex flex-col justify-end gap-3 pb-1">
              <Toggle
                label="Autoriser plusieurs participations"
                checked={draft.allowRepeat}
                onChange={(allowRepeat) => setDraft({ ...draft, allowRepeat })}
              />
              <Toggle
                label="Envoyer le gain par SMS"
                checked={draft.sendPrizeSms}
                onChange={(sendPrizeSms) =>
                  setDraft({ ...draft, sendPrizeSms })
                }
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h4 className="m-0 text-sm font-extrabold text-slate-900">
                Récompenses
              </h4>
              <span className="text-xs font-bold text-slate-500">
                Poids total : {weightTotal} (plus haut = plus probable)
              </span>
            </div>
            <div className="space-y-3">
              {draft.segments.map((seg, i) => (
                <div
                  key={seg.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 p-3"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <input
                      type="color"
                      className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200"
                      value={seg.color}
                      onChange={(e) =>
                        updateSegment(i, { color: e.target.value })
                      }
                      aria-label="Couleur"
                    />
                    <input
                      className={cn(inp, "min-w-[140px] flex-1")}
                      value={seg.label}
                      onChange={(e) =>
                        updateSegment(i, { label: e.target.value })
                      }
                      placeholder="Libellé"
                    />
                    <input
                      type="number"
                      min={1}
                      className={cn(inp, "w-20")}
                      value={seg.probabilityWeight}
                      onChange={(e) =>
                        updateSegment(i, {
                          probabilityWeight: Math.max(
                            1,
                            Number(e.target.value) || 1,
                          ),
                        })
                      }
                      title="Poids de probabilité"
                    />
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={seg.isLosing}
                        onChange={(e) =>
                          updateSegment(i, { isLosing: e.target.checked })
                        }
                      />
                      Perdant
                    </label>
                    <button
                      type="button"
                      className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                      aria-label="Supprimer"
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
                    placeholder="Message à l'écran"
                  />
                  {!seg.isLosing && (
                    <input
                      className={inp}
                      value={seg.smsMessage}
                      onChange={(e) =>
                        updateSegment(i, { smsMessage: e.target.value })
                      }
                      placeholder="SMS du gain ({prenom})"
                    />
                  )}
                </div>
              ))}
            </div>
            <ProtoBtn
              className="mt-2 w-full"
              onClick={() =>
                setDraft({
                  ...draft,
                  segments: [
                    ...draft.segments,
                    emptySegment(draft.segments.length),
                  ],
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une récompense
            </ProtoBtn>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
              {error}
            </p>
          )}

          <ProtoBtn primary disabled={saving} onClick={() => void handleSave()}>
            {saving ? "Enregistrement…" : "Enregistrer la roue"}
          </ProtoBtn>
        </div>
      )}
    </div>
  );
}
