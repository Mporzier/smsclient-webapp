"use client";

import { copyTextToClipboard } from "@/components/smsclient/CopyableLinkField";
import { ParrainageTermsModal } from "@/components/smsclient/modals/ParrainageTermsModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useReferral } from "@/hooks/useReferral";
import { getPublicReferralUrl } from "@/lib/auth/siteUrl";
import { cn } from "@/lib/cn";
import { VIEW_STACK_CLIP_SAFE } from "@/lib/proto/viewLayout";
import { useI18n } from "@/lib/i18n";
import { Copy } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "@/components/ui/sonner";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function ParrainageView() {
  const { t } = useI18n();
  const { code, loading, error } = useReferral();
  const [termsOpen, setTermsOpen] = useState(false);

  const referralUrl = useMemo(
    () => (code ? getPublicReferralUrl(code) : ""),
    [code],
  );

  const linkedInShareUrl = useMemo(() => {
    if (!referralUrl) return "";
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;
  }, [referralUrl]);

  const onCopyLink = useCallback(() => {
    void copyTextToClipboard(referralUrl).then((ok) => {
      if (!ok) {
        toast.error(t("parrainage.copyFailed"));
        return;
      }
      toast(t("parrainage.copyOk"));
    });
  }, [referralUrl, t]);

  const onShareLinkedIn = useCallback(() => {
    if (!linkedInShareUrl) return;
    window.open(linkedInShareUrl, "_blank", "noopener,noreferrer");
  }, [linkedInShareUrl]);

  const heroSteps = [
    t("parrainage.hero.step1"),
    t("parrainage.hero.step2"),
    t("parrainage.hero.step3"),
  ];

  return (
    <div className={cn(VIEW_STACK_CLIP_SAFE, "gap-2 md:gap-3")}>
      {error ? (
        <Alert variant="destructive" className="shrink-0">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card
        size="sm"
        className={cn(
          "min-h-0 flex-1 overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 via-card to-card",
        )}
      >
        <CardContent className="grid h-full min-h-0 grid-cols-1 gap-4 py-0 md:grid-cols-2 md:items-stretch md:gap-5">
          <div className="flex min-h-0 min-w-0 flex-col justify-center gap-2 py-1">
            <CardTitle className="!text-2xl font-black leading-[1.08] tracking-tight sm:!text-3xl md:!text-4xl lg:!text-[2.625rem] xl:!text-5xl">
              <span className="block text-foreground">
                {t("parrainage.hero.titleLine1")}
              </span>
              <span className="mt-1 block text-blue-600 sm:mt-1.5 dark:text-blue-400">
                {t("parrainage.hero.titleLine2")}
              </span>
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed lg:text-sm">
              {t("parrainage.hero.body")}
            </CardDescription>
            <ol className="flex flex-col gap-1.5">
              {heroSteps.map((label, i) => (
                <li
                  key={label}
                  className="flex items-start gap-2.5 rounded-lg bg-muted/80 px-3 py-2 text-xs leading-snug text-foreground lg:text-sm"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0 pt-0.5">{label}</span>
                </li>
              ))}
            </ol>
            <Button
              type="button"
              variant="link"
              className="h-auto w-fit p-0 text-xs font-semibold lg:text-sm"
              onClick={() => setTermsOpen(true)}
            >
              {t("parrainage.termsLink")}
            </Button>
          </div>
          <div
            aria-hidden
            className="min-h-[140px] rounded-xl border border-dashed border-rose-200/90 bg-rose-50/90 md:min-h-0 md:h-full md:w-full"
          />
        </CardContent>
      </Card>

      <div className="flex shrink-0 flex-col gap-2 md:gap-3">
        <Card size="sm" className="w-full min-h-0">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-bold">
              {t("parrainage.linkTitle")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("parrainage.linkDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InputGroup className="h-9 w-full">
              <InputGroupInput
                readOnly
                value={loading ? "" : referralUrl}
                placeholder={loading ? "…" : undefined}
                aria-label={t("parrainage.linkTitle")}
                className="truncate text-xs font-medium"
              />
              <InputGroupAddon align="inline-end" className="shrink-0">
                <InputGroupButton
                  variant="default"
                  size="sm"
                  disabled={loading || !referralUrl}
                  onClick={onCopyLink}
                >
                  <Copy aria-hidden />
                  {t("parrainage.copyLink")}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </CardContent>
        </Card>

        <Card size="sm" className="w-full min-h-0">
          <CardHeader className="pb-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {t("parrainage.shareSectionEyebrow")}
            </p>
            <CardTitle className="text-sm font-bold">
              {t("parrainage.shareLinkedInTitle")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("parrainage.shareLinkedInDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2"
              disabled={loading || !linkedInShareUrl}
              onClick={onShareLinkedIn}
            >
              <LinkedInIcon className="size-4" />
              {t("parrainage.shareLinkedInCta")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <ParrainageTermsModal
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
      />
    </div>
  );
}
