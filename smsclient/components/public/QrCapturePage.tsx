"use client";

import { RewardWheel } from "@/components/public/RewardWheel";
import { createClient } from "@/lib/supabase/client";
import {
  fetchPublicQrConfig,
  spinQrWheel,
} from "@/lib/supabase/qrWheel";
import { frDisplayToE164, normalizeFRPhone } from "@/lib/proto/smsUtils";
import type { QrWheelPublicConfig, QrWheelSpinResult } from "@/lib/types/qrWheel";
import { useEffect, useMemo, useState } from "react";

type QrCapturePageProps = {
  slug: string;
};

type Phase = "form" | "wheel" | "prize" | "thanks";

type QrSubmitResult = {
  ok?: boolean;
  error?: string;
  client_id?: string;
};

function messageForQrSubmitError(code: string | undefined): string {
  switch (code) {
    case "invalid_phone":
      return "Indique un numéro mobile français valide (06 ou 07, 10 chiffres).";
    case "invalid_slug":
      return "Ce lien n’est plus valide. Demande un nouveau QR code au commerce.";
    case "first_name_required":
      return "Le prénom est obligatoire.";
    default:
      return "Enregistrement impossible pour le moment. Réessaie dans un instant.";
  }
}

function messageForSpinError(code: string | null): string {
  switch (code) {
    case "already_spun":
      return "Ce numéro a déjà participé à la roue.";
    case "opt_in_required":
      return "La participation nécessite l’acceptation des SMS.";
    case "wheel_disabled":
      return "La roue n’est pas disponible pour le moment.";
    default:
      return "Impossible de lancer la roue. Réessaie plus tard.";
  }
}

export function QrCapturePage({ slug }: QrCapturePageProps) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [invalidSlug, setInvalidSlug] = useState(false);
  const [wheel, setWheel] = useState<QrWheelPublicConfig | null>(null);

  const [phase, setPhase] = useState<Phase>("form");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [birthday, setBirthday] = useState("");
  const [optIn, setOptIn] = useState(true);

  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [winIndex, setWinIndex] = useState<number | null>(null);
  const [prize, setPrize] = useState<QrWheelSpinResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const res = await fetchPublicQrConfig(supabase, slug);
      if (cancelled) return;
      if (!res.ok) {
        setInvalidSlug(true);
        setWheel(null);
      } else {
        setInvalidSlug(false);
        setWheel(res.wheel);
      }
      setLoading(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [slug, supabase]);

  const wheelActive = Boolean(wheel?.enabled && (wheel?.segments.length ?? 0) > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const first = firstName.trim();
    if (!first) {
      setError("Le prénom est obligatoire.");
      return;
    }
    const e164 = frDisplayToE164(phone);
    if (!e164) {
      setError("Indique un numéro mobile FR valide (06/07).");
      return;
    }
    if (wheelActive && !optIn) {
      setError(
        "Vous devez accepter de recevoir des SMS pour participer à la roue des récompenses.",
      );
      return;
    }
    setSaving(true);
    const birthdayValue = birthday.trim();
    const { data, error: submitErr } = await supabase.rpc("submit_qr_lead", {
      p_slug: slug,
      p_first_name: first,
      p_last_name: lastName.trim(),
      p_phone_e164: e164,
      p_opt_in: optIn,
      p_birthday: birthdayValue || null,
    });
    setSaving(false);
    if (submitErr) {
      setError(submitErr.message);
      return;
    }
    const payload = data as QrSubmitResult | null;
    if (!payload?.ok) {
      setError(messageForQrSubmitError(payload?.error));
      return;
    }
    setPhoneE164(e164);
    if (wheelActive && optIn) {
      setPhase("wheel");
      setWinIndex(null);
      setPrize(null);
    } else {
      setPhase("thanks");
    }
  }

  async function handleWheelSpin() {
    if (!wheel || !phoneE164) return;
    setError(null);
    setWheelSpinning(true);
    setWinIndex(null);
    const { data, error: spinErr } = await spinQrWheel(supabase, slug, phoneE164);
    if (spinErr || !data) {
      setWheelSpinning(false);
      setError(messageForSpinError(spinErr));
      return;
    }
    const idx = wheel.segments.findIndex((s) => s.id === data.segmentId);
    setWinIndex(idx >= 0 ? idx : 0);
    setPrize(data);
  }

  function handleWheelAnimationEnd() {
    setWheelSpinning(false);
    setPhase("prize");
  }

  const inp =
    "h-11 w-full rounded-[14px] border border-slate-300/50 bg-transparent px-3.5 text-[15px] font-bold text-slate-900 outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]";

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-10">
      <div className="mx-auto w-full max-w-[560px] rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_22px_50px_rgba(15,23,42,0.10)]">
        {phase === "form" && (
          <>
            <h1 className="m-0 text-3xl font-extrabold text-slate-900">
              Reste en contact
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Laisse tes coordonnées pour recevoir les actus et offres par SMS.
              {wheelActive && " Puis tente ta chance à la roue des récompenses !"}
            </p>
          </>
        )}

        {loading ? (
          <p className="mt-6 text-sm font-bold text-slate-500">
            Chargement du formulaire…
          </p>
        ) : invalidSlug ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
            Ce QR code n&apos;est pas valide ou n&apos;est plus actif.
          </div>
        ) : phase === "wheel" && wheel ? (
          <div className="mt-4">
            <RewardWheel
              segments={wheel.segments}
              title={wheel.title}
              subtitle={wheel.subtitle}
              spinning={wheelSpinning}
              winIndex={winIndex}
              onSpin={() => void handleWheelSpin()}
              onAnimationEnd={handleWheelAnimationEnd}
            />
            {error && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
                {error}
              </div>
            )}
          </div>
        ) : phase === "prize" && prize ? (
          <div className="mt-6 space-y-3">
            <div
              className={
                prize.isLosing
                  ? "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4"
              }
            >
              <p className="m-0 text-lg font-extrabold text-slate-900">
                {prize.isLosing ? "Dommage…" : "Félicitations ! 🎉"}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {prize.screenMessage}
              </p>
              {!prize.isLosing && prize.validUntil && (
                <p className="mt-2 text-xs font-bold text-emerald-800">
                  Valable jusqu&apos;au{" "}
                  {new Date(prize.validUntil).toLocaleDateString("fr-FR")}
                </p>
              )}
              {prize.sendPrizeSms && !prize.isLosing && (
                <p className="mt-2 text-xs font-semibold text-slate-600">
                  Un SMS récapitulatif vous sera envoyé sous peu.
                </p>
              )}
            </div>
          </div>
        ) : phase === "thanks" ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <p className="m-0 text-base font-extrabold text-emerald-900">
              Merci 🎉
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-900/90">
              Tes informations ont bien été enregistrées.
            </p>
          </div>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-600">
                Prénom *
              </label>
              <input
                className={inp}
                maxLength={30}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex : Patrick"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-600">
                Nom
              </label>
              <input
                className={inp}
                maxLength={30}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex : Dupont"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-600">
                Téléphone *
              </label>
              <input
                className={inp}
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(normalizeFRPhone(e.target.value))}
                placeholder="06 12 34 56 78"
              />
            </div>
            <div>
              <label
                className="mb-1.5 block text-xs font-black text-slate-600"
                htmlFor="qr-capture-birthday"
              >
                Anniversaire
              </label>
              <input
                id="qr-capture-birthday"
                name="birthday"
                type="date"
                className={inp}
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Optionnel
              </p>
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2f6fed]"
                checked={optIn}
                onChange={(e) => setOptIn(e.target.checked)}
              />
              <span>
                J&apos;accepte de recevoir des SMS d&apos;information et
                d&apos;offres.
                {wheelActive && (
                  <span className="block text-xs font-bold text-[#2f6fed]">
                    Obligatoire pour participer à la roue.
                  </span>
                )}
              </span>
            </label>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-1 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-[14px] border border-transparent bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] px-[18px] text-[15px] font-bold text-white shadow-[0_18px_30px_rgba(47,111,237,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Enregistrement…"
                : wheelActive
                  ? "S'inscrire et jouer"
                  : "Envoyer"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
