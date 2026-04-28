"use client";

import { EmailPendingModal } from "@/components/auth/EmailPendingModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { mapAuthErrorToFrench } from "@/lib/auth/authErrors";
import { getEmailRedirectTo } from "@/lib/auth/siteUrl";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/**
 * Redirige vers /auth/login si non connecté (sauf pages /auth/*).
 * Redirige vers / si connecté (e-mail confirmé) et sur une page /auth/*.
 * Compte connecté sans e-mail confirmé : le dashboard est masqué, modal d’attente.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname?.startsWith("/auth") ?? false;
  /** Même logique que `basePath` : le pathname côté app n’inclut pas le préfixe du repo. */
  const isPublicCapturePage =
    pathname === "/capture" || pathname === "/capture/" || false;
  const isPublicPage = isAuthPage || isPublicCapturePage;

  const unconfirmed = Boolean(user && !user.email_confirmed_at);

  const [resendPending, setResendPending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendIsError, setResendIsError] = useState(false);

  const onResendConfirmation = useCallback(async () => {
    if (!isSupabaseConfigured() || !user?.email) {
      return;
    }
    setResendPending(true);
    setResendMessage(null);
    setResendIsError(false);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: getEmailRedirectTo() },
    });
    setResendPending(false);
    if (error) {
      setResendIsError(true);
      setResendMessage(mapAuthErrorToFrench(error));
    } else {
      setResendIsError(false);
      setResendMessage("E-mail de confirmation renvoyé. Vérifie ta boîte.");
    }
  }, [user]);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (unconfirmed) {
      return;
    }
    if (!user && !isPublicPage) {
      router.replace("/auth/login");
    }
    if (user && isAuthPage) {
      router.replace("/");
    }
  }, [user, loading, isAuthPage, isPublicPage, router, pathname, unconfirmed]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-600">
        <p className="text-sm font-semibold">Chargement…</p>
      </div>
    );
  }

  if (unconfirmed && user) {
    return (
      <>
        <div className="min-h-screen bg-[#f5f7fb]" />
        <EmailPendingModal
          open
          onClose={signOut}
          email={user.email}
          onResend={onResendConfirmation}
          resendPending={resendPending}
          resendMessage={resendMessage}
          resendIsError={resendIsError}
          variant="blocking"
        />
      </>
    );
  }

  if (!user && !isPublicPage) {
    return null;
  }

  if (user && isAuthPage) {
    return null;
  }

  return <>{children}</>;
}
