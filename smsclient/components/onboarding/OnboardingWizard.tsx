"use client";

import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { ProtoBtn } from "@/components/smsclient/ui";
import { cn } from "@/lib/cn";
import { sanitizeSender } from "@/lib/proto/smsUtils";
import { BUSINESS_ACTIVITIES } from "@/lib/types/businessActivity";
import { defaultProfileForm, profileToForm } from "@/lib/supabase/profile";
import type { UserProfileForm } from "@/lib/types/profile";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect, useMemo, useState } from "react";
import { Building2, MessageSquare, UserRound } from "lucide-react";

function suggestSender(company: string) {
  const s = sanitizeSender(company).slice(0, 11);
  return s || "MONSHOP";
}

const STEPS = [
  { id: 1, title: "Profil", icon: UserRound },
  { id: 2, title: "Entreprise", icon: Building2 },
  { id: 3, title: "SMS", icon: MessageSquare },
] as const;

const inp =
  "h-11 w-full rounded-[14px] border border-slate-300/50 bg-white px-3.5 text-[15px] font-bold text-slate-900 outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]";
const lbl = "mb-1.5 block text-xs font-black text-slate-600";

export function OnboardingWizard() {
  const { user } = useAuth();
  const { completeOnboarding, profile } = useUserProfile();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UserProfileForm>(() => {
    const email = user?.email ?? "";
    const base = defaultProfileForm(email);
    if (!profile) return base;
    const fromProfile = profileToForm(profile);
    return {
      ...fromProfile,
      email,
      billingContact: fromProfile.billingContact || email,
      sender: fromProfile.sender || suggestSender(fromProfile.companyName),
    };
  });

  useEffect(() => {
    if (!profile) return;
    const email = user?.email ?? "";
    const fromProfile = profileToForm(profile);
    setForm({
      ...fromProfile,
      email,
      billingContact: fromProfile.billingContact || email,
      sender: fromProfile.sender || suggestSender(fromProfile.companyName),
    });
  }, [profile, user?.email]);

  const setField = <K extends keyof UserProfileForm>(
    key: K,
    value: UserProfileForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!form.firstName.trim()) return "Le prénom est obligatoire.";
      if (!form.phone.trim()) return "Le téléphone est obligatoire.";
      return null;
    }
    if (s === 2) {
      if (!form.companyName.trim()) return "Le nom de l'entreprise est obligatoire.";
      if (!form.businessActivity) return "Choisis ton activité.";
      return null;
    }
    if (s === 3) {
      if (!sanitizeSender(form.sender).trim()) {
        return "Le nom d'expéditeur SMS est obligatoire.";
      }
      return null;
    }
    return null;
  };

  const onNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    if (step === 2 && !form.sender.trim()) {
      setField("sender", suggestSender(form.companyName));
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const onFinish = async () => {
    for (let s = 1; s <= 3; s++) {
      const err = validateStep(s);
      if (err) {
        setStep(s);
        setError(err);
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      await completeOnboarding({
        ...form,
        email: user?.email ?? form.email,
        sender: sanitizeSender(form.sender),
        billingContact: form.billingContact.trim() || user?.email || "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
      setSaving(false);
    }
  };

  const stepHint = useMemo(() => {
    switch (step) {
      case 1:
        return "Commençons par te connaître.";
      case 2:
        return "Parle-nous de ton commerce.";
      case 3:
        return "Dernier détail : l'expéditeur affiché sur tes SMS.";
      default:
        return "";
    }
  }, [step]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fb]">
      <header className="border-b border-slate-200/80 bg-white px-6 py-5">
        <p className="m-0 text-xs font-black uppercase tracking-wide text-blue-600">
          Bienvenue sur SMSClient
        </p>
        <h1 className="m-0 mt-1 text-2xl font-black text-slate-900">
          Configure ton compte
        </h1>
        <p className="m-0 mt-1 text-sm font-semibold text-slate-600">
          {stepHint}
        </p>
        <ol className="mt-5 flex gap-2" aria-label="Étapes">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const active = s.id === step;
            const done = s.id < step;
            return (
              <li
                key={s.id}
                className={cn(
                  "flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold",
                  active &&
                    "border-blue-200 bg-blue-50 text-blue-800",
                  done && !active && "border-emerald-200 bg-emerald-50 text-emerald-800",
                  !active && !done && "border-slate-200 bg-slate-50 text-slate-500",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{s.title}</span>
              </li>
            );
          })}
        </ol>
      </header>

      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-6 py-8">
        {error && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
            {error}
          </p>
        )}

        {step === 1 && (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <h2 className="m-0 text-base font-black text-slate-900">
              Informations personnelles
            </h2>
            <div className="grid grid-cols-2 gap-3 max-[500px]:grid-cols-1">
              <div>
                <label className={lbl}>Prénom *</label>
                <input
                  className={inp}
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className={lbl}>Nom</label>
                <input
                  className={inp}
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={lbl}>E-mail</label>
              <input className={cn(inp, "bg-slate-50 text-slate-600")} value={form.email} readOnly />
            </div>
            <div>
              <label className={lbl}>Téléphone *</label>
              <input
                className={inp}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <h2 className="m-0 text-base font-black text-slate-900">
              Ton entreprise
            </h2>
            <div>
              <label className={lbl}>Nom de l&apos;entreprise *</label>
              <input
                className={inp}
                value={form.companyName}
                onChange={(e) => setField("companyName", e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className={lbl}>Activité *</label>
              <select
                className={inp}
                value={form.businessActivity}
                onChange={(e) =>
                  setField(
                    "businessActivity",
                    e.target.value as UserProfileForm["businessActivity"],
                  )
                }
              >
                <option value="">Sélectionner…</option>
                {BUSINESS_ACTIVITIES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="m-0 text-xs font-semibold text-slate-500">
              Tu pourras compléter SIRET, adresse de facturation, etc. dans les
              paramètres plus tard.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <h2 className="m-0 text-base font-black text-slate-900">
              Expéditeur SMS
            </h2>
            <p className="m-0 text-sm font-semibold text-slate-600">
              Nom affiché à la réception des SMS (11 caractères max, sans
              accents).
            </p>
            <div>
              <label className={lbl}>Nom d&apos;expéditeur *</label>
              <input
                className={inp}
                maxLength={11}
                value={form.sender}
                onChange={(e) =>
                  setField("sender", sanitizeSender(e.target.value))
                }
                autoFocus
              />
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {sanitizeSender(form.sender).length}/11
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between gap-3">
          <ProtoBtn
            disabled={step === 1 || saving}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            Retour
          </ProtoBtn>
          {step < 3 ? (
            <ProtoBtn primary onClick={onNext}>
              Continuer
            </ProtoBtn>
          ) : (
            <ProtoBtn primary disabled={saving} onClick={() => void onFinish()}>
              {saving ? "Enregistrement…" : "Terminer"}
            </ProtoBtn>
          )}
        </div>
      </main>
    </div>
  );
}
