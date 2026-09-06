"use client";

import { completeAuthCallback } from "@/lib/auth/handleAuthCallback";
import { AppLoadingOverlay } from "@/components/ui/AppLoadingOverlay";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthCallbackClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void completeAuthCallback().then((outcome) => {
      if (!active) return;
      if (outcome.kind === "email_changed") {
        router.replace("/auth/login/?email_changed=1");
        return;
      }
      if (outcome.kind === "password_recovery") {
        router.replace("/auth/reset-password/");
        return;
      }
      if (outcome.kind === "default") {
        router.replace("/");
        return;
      }
      setError(outcome.message);
    });

    return () => {
      active = false;
    };
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f5f7fb] px-4 py-12 text-center">
        <p className="max-w-md text-sm text-destructive">{error}</p>
        <Button asChild variant="outline">
          <Link href="/auth/login/">Retour à la connexion</Link>
        </Button>
      </div>
    );
  }

  return <AppLoadingOverlay />;
}
