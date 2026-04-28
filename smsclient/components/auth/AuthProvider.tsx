"use client";

import { createClient } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const getSessionWithTimeout = async () => {
      const timeoutMs = 5000;
      const timeout = new Promise<null>((resolve) => {
        window.setTimeout(() => resolve(null), timeoutMs);
      });
      const sessionPromise = supabase.auth
        .getSession()
        .then(({ data: { session: nextSession } }) => nextSession);
      return Promise.race([sessionPromise, timeout]);
    };
    const syncSession = async () => {
      try {
        const nextSession = await getSessionWithTimeout();
        if (!active) {
          return;
        }
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
      } catch {
        if (!active) {
          return;
        }
        setSession(null);
        setUser(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) {
        return;
      }
      setSession(next);
      setUser(next?.user ?? null);
      setLoading(false);
    });

    const onPageShow = () => {
      void syncSession();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncSession();
      }
    };

    void syncSession();
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo(
    () => ({ user, session, loading, signOut }),
    [user, session, loading, signOut],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return ctx;
}
