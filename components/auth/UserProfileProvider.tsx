"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { sanitizeSender } from "@/lib/proto/smsUtils";
import {
  completeUserOnboarding,
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
  useRef,
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
  const userId = user?.id ?? null;
  const userEmail = user?.email ?? "";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [settled, setSettled] = useState<{
    nonce: number;
    userId: string | null;
  } | null>(null);
  const waitersRef = useRef<Array<() => void>>([]);

  const flushWaiters = useCallback(() => {
    const waiters = waitersRef.current.splice(0);
    for (const resolve of waiters) resolve();
  }, []);

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

  if (!userId && settled !== null) {
    setSettled(null);
    setProfile(null);
    setError(null);
  }

  const loading =
    authLoading ||
    (userId != null &&
      (settled == null ||
        settled.nonce !== nonce ||
        settled.userId !== userId));

  useEffect(() => {
    if (userId) return;
    flushWaiters();
  }, [userId, flushWaiters]);

  useEffect(() => {
    if (authLoading || !userId) return;
    let cancelled = false;
    const requestNonce = nonce;
    const requestUserId = userId;
    const email = userEmail;

    void getOrCreateUserProfile(supabase, requestUserId, email).then(
      ({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          setProfile(null);
          setSettled({ nonce: requestNonce, userId: requestUserId });
          flushWaiters();
          return;
        }
        let next = data;
        if (next && !next.sender && !next.onboardingCompleted) {
          const legacy = readLegacySender();
          if (legacy) {
            next = { ...next, sender: legacy };
          }
        }
        if (next?.sender) {
          persistLegacySender(next.sender);
        }
        setError(null);
        setProfile(next);
        setSettled({ nonce: requestNonce, userId: requestUserId });
        flushWaiters();
      },
    );

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    userId,
    userEmail,
    supabase,
    nonce,
    readLegacySender,
    persistLegacySender,
    flushWaiters,
  ]);

  const refresh = useCallback(() => {
    return new Promise<void>((resolve) => {
      waitersRef.current.push(resolve);
      setNonce((n) => n + 1);
    });
  }, []);

  const saveProfile = useCallback(
    async (form: UserProfileForm) => {
      if (!user?.id) throw new Error("Vous devez être connecté.");
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
    [user, supabase, persistLegacySender],
  );

  const completeOnboarding = useCallback(
    async (form: UserProfileForm) => {
      if (!user?.id) throw new Error("Vous devez être connecté.");
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
    [user, supabase, persistLegacySender],
  );

  const setSmsSender = useCallback(
    async (v: string) => {
      const sender = sanitizeSender(v);
      persistLegacySender(sender);
      if (!profile || !user?.id) {
        setProfile((prev) => (prev ? { ...prev, sender } : null));
        return;
      }
      const form = { ...profileToForm(profile), sender };
      await saveProfile(form);
    },
    [profile, user, persistLegacySender, saveProfile],
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
