"use client";

import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { BusinessActivityPicker } from "@/components/onboarding/BusinessActivityPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  brandBtnCls,
  brandBtnPrimaryCls,
  brandInputCls,
} from "@/components/smsclient/modals/modalChrome";
import { cn } from "@/lib/cn";
import { sanitizeSender } from "@/lib/proto/smsUtils";
import { defaultProfileForm, profileToForm } from "@/lib/supabase/profile";
import type { UserProfileForm } from "@/lib/types/profile";
import { useAuth } from "@/components/auth/AuthProvider";
import { useMemo, useState } from "react";
import { Building2, MessageSquare, Store, UserRound } from "lucide-react";

function suggestSender(company: string) {
  const s = sanitizeSender(company).slice(0, 11);
  return s || "MONSHOP";
}

const STEPS = [
  { id: 1, title: "Profil", icon: UserRound },
  { id: 2, title: "Secteur", icon: Store },
  { id: 3, title: "Entreprise", icon: Building2 },
  { id: 4, title: "SMS", icon: MessageSquare },
] as const;

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

  const profileSyncKey = profile
    ? `${profile.userId}:${user?.email ?? ""}`
    : null;
  const [syncedProfileKey, setSyncedProfileKey] = useState<string | null>(null);
  if (profile && profileSyncKey !== syncedProfileKey) {
    setSyncedProfileKey(profileSyncKey);
    const email = user?.email ?? "";
    const fromProfile = profileToForm(profile);
    setForm({
      ...fromProfile,
      email,
      billingContact: fromProfile.billingContact || email,
      sender: fromProfile.sender || suggestSender(fromProfile.companyName),
    });
  }

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
      if (!form.businessActivity)
        return "Choisissez votre type d'activité (secteur puis métier).";
      return null;
    }
    if (s === 3) {
      if (!form.companyName.trim()) return "Le nom de l'entreprise est obligatoire.";
      return null;
    }
    if (s === 4) {
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
    if (step === 3 && !form.sender.trim()) {
      setField("sender", suggestSender(form.companyName));
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const onFinish = async () => {
    for (let s = 1; s <= 4; s++) {
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
        return "Commençons par vous connaître.";
      case 2:
        return "Secteur puis métier précis — modèles SMS et automatisations adaptés.";
      case 3:
        return "Parlez-nous de votre commerce.";
      case 4:
        return "Dernier détail : l'expéditeur affiché sur vos SMS.";
      default:
        return "";
    }
  }, [step]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card px-6 py-5">
        <p className="m-0 text-xs font-black uppercase tracking-wide text-primary">
          Bienvenue sur SMSClient
        </p>
        <h1 className="m-0 mt-1 text-2xl font-black text-foreground">
          Configurez votre compte
        </h1>
        <p className="m-0 mt-1 text-sm font-semibold text-muted-foreground">
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
                    "border-primary/25 bg-accent text-primary",
                  done && !active && "border-emerald-200 bg-emerald-50 text-emerald-800",
                  !active && !done && "border-border bg-muted text-muted-foreground",
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
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <h2 className="m-0 text-base font-black text-foreground">
              Informations personnelles
            </h2>
            <div className="grid grid-cols-2 gap-3 max-[500px]:grid-cols-1">
              <div>
                <Label className="mb-1.5 block text-xs font-black text-muted-foreground">
                  Prénom *
                </Label>
                <Input
                  className={brandInputCls}
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-black text-muted-foreground">
                  Nom
                </Label>
                <Input
                  className={brandInputCls}
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-black text-muted-foreground">
                E-mail
              </Label>
              <Input
                className={cn(brandInputCls, "bg-muted text-muted-foreground")}
                value={form.email}
                readOnly
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-black text-muted-foreground">
                Téléphone *
              </Label>
              <Input
                className={brandInputCls}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <h2 className="m-0 text-base font-black text-foreground">
              Votre activité
            </h2>
            <p className="m-0 text-sm font-semibold text-muted-foreground">
              Choisissez d&apos;abord un secteur (retail, restauration…), puis
              votre métier précis pour des modèles SMS adaptés.
            </p>
            <BusinessActivityPicker
              value={form.businessActivity}
              onChange={(id) => setField("businessActivity", id)}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <h2 className="m-0 text-base font-black text-foreground">
              Votre entreprise
            </h2>
            <div>
              <Label className="mb-1.5 block text-xs font-black text-muted-foreground">
                Nom de l&apos;entreprise *
              </Label>
              <Input
                className={brandInputCls}
                value={form.companyName}
                onChange={(e) => setField("companyName", e.target.value)}
                autoFocus
              />
            </div>
            <p className="m-0 text-xs font-semibold text-muted-foreground">
              Vous pourrez compléter SIRET, adresse de facturation, etc. dans les
              paramètres plus tard.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
            <h2 className="m-0 text-base font-black text-foreground">
              Expéditeur SMS
            </h2>
            <p className="m-0 text-sm font-semibold text-muted-foreground">
              Nom affiché à la réception des SMS (11 caractères max, sans
              accents).
            </p>
            <div>
              <Label className="mb-1.5 block text-xs font-black text-muted-foreground">
                Nom d&apos;expéditeur *
              </Label>
              <Input
                className={brandInputCls}
                maxLength={11}
                value={form.sender}
                onChange={(e) =>
                  setField("sender", sanitizeSender(e.target.value))
                }
                autoFocus
              />
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                {sanitizeSender(form.sender).length}/11
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            className={brandBtnCls}
            disabled={step === 1 || saving}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            Retour
          </Button>
          {step < 4 ? (
            <Button
              type="button"
              variant="default"
              className={brandBtnPrimaryCls}
              onClick={onNext}
            >
              Continuer
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              className={brandBtnPrimaryCls}
              disabled={saving}
              onClick={() => void onFinish()}
            >
              {saving ? "Enregistrement…" : "Terminer"}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
