"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import type { ReactNode } from "react";

export function OnboardingGate({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { loading: profileLoading, needsOnboarding, error } = useUserProfile();

  if (!user || authLoading) {
    return <>{children}</>;
  }

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-600">
        <p className="text-sm font-semibold">Chargement de ton compte…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-6">
        <p className="max-w-md rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-bold text-rose-900">
          {error}
        </p>
      </div>
    );
  }

  if (needsOnboarding) {
    return <OnboardingWizard />;
  }

  return <>{children}</>;
}
