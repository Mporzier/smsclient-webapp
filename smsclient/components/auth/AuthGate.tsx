"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Redirige vers /auth/login si non connecté (sauf pages /auth/*).
 * Redirige vers / si connecté et sur une page /auth/*.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname?.startsWith("/auth") ?? false;
  /** Même logique que `basePath` : le pathname côté app n’inclut pas le préfixe du repo. */
  const isPublicCapturePage =
    pathname === "/capture" || pathname === "/capture/" || false;
  const isPublicPage = isAuthPage || isPublicCapturePage;

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublicPage) {
      router.replace("/auth/login");
    }
    if (user && isAuthPage) {
      router.replace("/");
    }
  }, [user, loading, isAuthPage, isPublicPage, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-600">
        <p className="text-sm font-semibold">Chargement…</p>
      </div>
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
