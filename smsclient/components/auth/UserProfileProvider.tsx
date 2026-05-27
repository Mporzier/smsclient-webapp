"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { sanitizeSender } from "@/lib/proto/smsUtils";
import {
  completeUserOnboarding,
  defaultProfileForm,
  getOrCreateUserProfile,
  profileToForm,
  updateUserProfile,
} from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile, UserProfileForm } from "@/lib/types/profile";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "smsclient.smsSender";
const DEFAULT_SENDER = "BOULANGERIE";

type UserProfileContextValue = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  needsOnboarding: boolean;
  refresh: () => Promise<void>;
  saveProfile: (form: UserProfileForm) => Promise<void>;
  completeOnboarding: (form: UserProfileForm) => Promise<void>;
  smsSender: string;
  setSmsSender: (v: string) => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const readLegacySender = useCallback((): string => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw != null) return sanitizeSender(raw);
    } catch {
      /* ignore */
    }
    return DEFAULT_SENDER;
  }, []);

  const persistLegacySender = useCallback((v: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, sanitizeSender(v));
    } catch {
      /* ignore */
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const email = user.email ?? "";
    const { data, error: err } = await getOrCreateUserProfile(
      supabase,
      user.id,
      email,
    );
    if (err) {
      setError(err.message);
      setProfile(null);
      setLoading(false);
      return;
    }
    if (data && !data.sender && !data.onboardingCompleted) {
      const legacy = readLegacySender();
      if (legacy) {
        data.sender = legacy;
      }
    }
    if (data?.sender) {
      persistLegacySender(data.sender);
    }
    setProfile(data);
    setLoading(false);
  }, [user?.id, user?.email, supabase, readLegacySender, persistLegacySender]);

  useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [authLoading, refresh]);

  const saveProfile = useCallback(
    async (form: UserProfileForm) => {
      if (!user?.id) throw new Error("Tu dois être connecté.");
      const email = user.email ?? form.email;
      const { data, error: err } = await updateUserProfile(
        supabase,
        user.id,
        email,
        { ...form, email },
      );
      if (err) throw err;
      if (data) {
        setProfile(data);
        if (data.sender) persistLegacySender(data.sender);
      }
    },
    [user?.id, user?.email, supabase, persistLegacySender],
  );

  const completeOnboarding = useCallback(
    async (form: UserProfileForm) => {
      if (!user?.id) throw new Error("Tu dois être connecté.");
      const email = user.email ?? form.email;
      const { data, error: err } = await completeUserOnboarding(
        supabase,
        user.id,
        email,
        { ...form, email },
      );
      if (err) throw err;
      if (data) {
        setProfile(data);
        if (data.sender) persistLegacySender(data.sender);
      }
    },
    [user?.id, user?.email, supabase, persistLegacySender],
  );

  const setSmsSender = useCallback(
    async (v: string) => {
      const sender = sanitizeSender(v);
      persistLegacySender(sender);
      if (!profile || !user?.id) {
        setProfile((prev) =>
          prev ? { ...prev, sender } : null,
        );
        return;
      }
      const form = { ...profileToForm(profile), sender };
      await saveProfile(form);
    },
    [profile, user?.id, persistLegacySender, saveProfile],
  );

  const smsSender = profile?.sender || readLegacySender();

  const needsOnboarding = Boolean(
    user?.id && !loading && profile && !profile.onboardingCompleted,
  );

  const value = useMemo(
    () => ({
      profile,
      loading: authLoading || loading,
      error,
      needsOnboarding,
      refresh,
      saveProfile,
      completeOnboarding,
      smsSender,
      setSmsSender,
    }),
    [
      profile,
      authLoading,
      loading,
      error,
      needsOnboarding,
      refresh,
      saveProfile,
      completeOnboarding,
      smsSender,
      setSmsSender,
    ],
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile must be used within UserProfileProvider");
  }
  return ctx;
}
