import { QrCaptureContent } from "./QrCaptureContent";
import { Suspense } from "react";

/**
 * Page publique statique (export GitHub Pages). Le slug QR est passé en
 * `?s=<slug>` car les routes `/capture/[slug]` ne sont pas prises en charge
 * sans `generateStaticParams` pour chaque slug possible.
 */
export default function CapturePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-600">
          <p className="text-sm font-semibold">Chargement…</p>
        </div>
      }
    >
      <QrCaptureContent />
    </Suspense>
  );
}
