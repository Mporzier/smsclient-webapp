"use client";

import { createClient } from "@/lib/supabase/client";
import { frDisplayToE164, normalizeFRPhone } from "@/lib/proto/smsUtils";
import { useEffect, useMemo, useState } from "react";

type QrCapturePageProps = {
  slug: string;
};

type QrSubmitResult = {
  ok?: boolean;
  error?: string;
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

export function QrCapturePage({ slug }: QrCapturePageProps) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [invalidSlug, setInvalidSlug] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [optIn, setOptIn] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const { data, error } = await supabase.rpc("resolve_qr_slug", {
        p_slug: slug,
      });
      if (cancelled) return;
      if (error) {
        setInvalidSlug(true);
      } else {
        const first = Array.isArray(data) ? data[0] : null;
        setInvalidSlug(!first || first.is_active === false);
      }
      setLoading(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [slug, supabase]);

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
    setSaving(true);
    const { data, error } = await supabase.rpc("submit_qr_lead", {
      p_slug: slug,
      p_first_name: first,
      p_last_name: lastName.trim(),
      p_phone_e164: e164,
      p_opt_in: optIn,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    const payload = data as QrSubmitResult | null;
    const ok = Boolean(payload?.ok);
    if (!ok) {
      setError(messageForQrSubmitError(payload?.error));
      return;
    }
    setSuccess(true);
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-10">
      <div className="mx-auto w-full max-w-[560px] rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_22px_50px_rgba(15,23,42,0.10)]">
        <h1 className="m-0 text-3xl font-extrabold text-slate-900">Reste en contact</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Laisse tes coordonnées pour recevoir les actus et offres par SMS.
        </p>

        {loading ? (
          <p className="mt-6 text-sm font-bold text-slate-500">Chargement du formulaire…</p>
        ) : invalidSlug ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
            Ce QR code n&apos;est pas valide ou n&apos;est plus actif.
          </div>
        ) : success ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <p className="m-0 text-base font-extrabold text-emerald-900">Merci 🎉</p>
            <p className="mt-1 text-sm font-semibold text-emerald-900/90">
              Tes informations ont bien été enregistrées.
            </p>
          </div>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-600">Prénom *</label>
              <input
                className="h-11 w-full rounded-[14px] border border-slate-300/50 bg-white px-3.5 text-[15px] font-bold text-slate-900 outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
                maxLength={30}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex : Patrick"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-600">Nom</label>
              <input
                className="h-11 w-full rounded-[14px] border border-slate-300/50 bg-white px-3.5 text-[15px] font-bold text-slate-900 outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
                maxLength={30}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex : Dupont"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-600">Téléphone *</label>
              <input
                className="h-11 w-full rounded-[14px] border border-slate-300/50 bg-white px-3.5 text-[15px] font-bold text-slate-900 outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(normalizeFRPhone(e.target.value))}
                placeholder="06 12 34 56 78"
              />
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2f6fed]"
                checked={optIn}
                onChange={(e) => setOptIn(e.target.checked)}
              />
              J&apos;accepte de recevoir des SMS d&apos;information et d&apos;offres.
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
              {saving ? "Enregistrement…" : "Envoyer"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
