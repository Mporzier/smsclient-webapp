"use client";

import { getAuthLoginPath, getAuthSignupUrl } from "@/lib/auth/siteUrl";
import { LoadingLabel } from "@/components/ui/loading-label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

function referralCodeFromPathname(pathname: string): string | null {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const prefix = base ? `${base}/parrainage/` : "/parrainage/";
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length).replace(/\/$/, "");
  if (!/^[A-Za-z0-9]{6,12}$/.test(rest)) return null;
  return rest.toUpperCase();
}

export function ParrainageLandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = useMemo(() => {
    const fromQuery =
      searchParams.get("c")?.trim() || searchParams.get("ref")?.trim() || "";
    if (fromQuery) return fromQuery.toUpperCase();
    if (typeof window === "undefined") return "";
    return referralCodeFromPathname(window.location.pathname) ?? "";
  }, [searchParams]);

  useEffect(() => {
    if (!code) return;
    router.replace(getAuthSignupUrl(code));
  }, [code, router]);

  if (code) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 text-slate-600">
        <LoadingLabel className="text-sm font-semibold">
          Redirection vers l&apos;inscription…
        </LoadingLabel>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f5f7fb] px-4 py-12 text-center">
      <p className="max-w-md text-sm font-medium text-slate-700">
        Lien de parrainage invalide ou incomplet.
      </p>
      <Link
        href={getAuthLoginPath()}
        className="text-sm font-bold text-blue-600 underline-offset-2 hover:underline"
      >
        Se connecter
      </Link>
    </div>
  );
}
