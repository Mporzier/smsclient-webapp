"use client";

import { ProtoBtn } from "@/components/smsclient/ui";
import { cn } from "@/lib/cn";
import { downloadShopQrPdf } from "@/lib/qr/downloadShopQrPdf";
import QRCode from "qrcode";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Download, MessageCircle, QrCode } from "lucide-react";

type QrCodeViewProps = {
  publicUrl: string;
  loading: boolean;
  error: string | null;
  companyName?: string;
  welcomeSmsEnabled: boolean;
  onWelcomeSmsChange: (enabled: boolean) => Promise<void>;
  onRegenerate: () => Promise<void>;
};

export function QrCodeView({
  publicUrl,
  loading,
  error,
  companyName,
  welcomeSmsEnabled,
  onWelcomeSmsChange,
  onRegenerate,
}: QrCodeViewProps) {
  const inp =
    "h-11 w-full rounded-[14px] border border-slate-300/50 bg-transparent px-3.5 text-[15px] font-bold text-slate-900 outline-none focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]";
  const [qrImage, setQrImage] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [welcomeSmsSaving, setWelcomeSmsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (!publicUrl) {
        setQrImage("");
        return;
      }
      void QRCode.toDataURL(publicUrl, {
        margin: 1,
        width: 280,
        color: { dark: "#0f172a", light: "#ffffff" },
      }).then((src: string) => {
        if (!cancelled) setQrImage(src);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [publicUrl]);

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4">
      <div className="flex items-start gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#dfe6f2] bg-gradient-to-br from-blue-50 to-indigo-50 text-[#2f6fed] shadow-[0_8px_16px_rgba(47,111,237,0.12)]"
          aria-hidden
        >
          <QrCode className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div>
          <h2 className="m-0 text-lg font-black text-slate-900">
            QR code boutique
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Affiche ce QR en boutique pour collecter des contacts via un
            formulaire public.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
        {loading ? (
          <div className="grid min-h-[280px] place-items-center text-sm font-bold text-slate-500">
            Génération du QR…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
            {error}
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid place-items-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
              {qrImage ? (
                <Image
                  src={qrImage}
                  alt="QR code boutique"
                  width={260}
                  height={260}
                  unoptimized
                  className="h-[260px] w-[260px]"
                />
              ) : (
                <div className="h-[260px] w-[260px] animate-pulse rounded-xl bg-slate-200" />
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black text-slate-600">
                Lien public
              </label>
              <input
                className={inp}
                value={publicUrl || ""}
                readOnly
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>
            {pdfError && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
                {pdfError}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <ProtoBtn
                primary
                disabled={!qrImage || pdfLoading}
                onClick={async () => {
                  if (!qrImage || !publicUrl) return;
                  setPdfError(null);
                  setPdfLoading(true);
                  try {
                    await downloadShopQrPdf({
                      qrDataUrl: qrImage,
                      publicUrl,
                      companyName,
                    });
                  } catch (e) {
                    setPdfError(
                      e instanceof Error
                        ? e.message
                        : "Impossible de générer le PDF.",
                    );
                  } finally {
                    setPdfLoading(false);
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                {pdfLoading ? "Génération…" : "Télécharger en PDF"}
              </ProtoBtn>
              <ProtoBtn
                onClick={async () => {
                  if (!publicUrl) return;
                  await navigator.clipboard.writeText(publicUrl);
                }}
              >
                Copier le lien
              </ProtoBtn>
              <ProtoBtn
                onClick={async () => {
                  setRegenLoading(true);
                  try {
                    await onRegenerate();
                  } finally {
                    setRegenLoading(false);
                  }
                }}
                disabled={regenLoading || loading}
              >
                {regenLoading ? "Régénération…" : "Régénérer le QR"}
              </ProtoBtn>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
        <div className="flex items-start gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#dfe6f2] bg-gradient-to-br from-blue-50 to-indigo-50 text-[#2f6fed]"
            aria-hidden
          >
            <MessageCircle className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="m-0 text-base font-extrabold text-slate-900">
                SMS de bienvenue
              </h3>
              <label className="flex shrink-0 cursor-pointer items-center gap-2">
                <span className="sr-only">
                  {welcomeSmsEnabled
                    ? "Désactiver le SMS de bienvenue"
                    : "Activer le SMS de bienvenue"}
                </span>
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={welcomeSmsEnabled}
                  disabled={loading || welcomeSmsSaving}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setWelcomeSmsSaving(true);
                    void onWelcomeSmsChange(next).finally(() => {
                      setWelcomeSmsSaving(false);
                    });
                  }}
                />
                <span
                  className={cn(
                    "relative h-7 w-12 rounded-full border transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5 peer-disabled:opacity-50",
                    welcomeSmsEnabled
                      ? "border-[#2f6fed] bg-[#2f6fed]"
                      : "border-slate-300 bg-slate-200",
                  )}
                  aria-hidden
                />
              </label>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-slate-600">
              Envoie un SMS automatique aux nouveaux contacts inscrits via le QR
              (uniquement s&apos;ils acceptent de recevoir des SMS).
            </p>
            {welcomeSmsEnabled && (
              <p className="mt-2 text-xs font-medium text-emerald-800">
                Activé — l&apos;envoi sera déclenché à chaque nouvelle inscription
                QR.
              </p>
            )}
          </div>
        </div>
      </div>

      <p className={cn("m-0 text-xs font-semibold leading-relaxed text-slate-500")}>
        Les contacts saisis via ce formulaire apparaissent dans ta liste avec la
        source « QR boutique » (prénom, nom, téléphone, anniversaire optionnel).
      </p>
    </div>
  );
}
