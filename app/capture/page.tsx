import { QrCaptureContent } from "./QrCaptureContent";
import { LoadingLabel } from "@/components/ui/loading-label";
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
          <LoadingLabel className="text-sm font-semibold">
            Chargement…
          </LoadingLabel>
        </div>
      }
    >
      <QrCaptureContent />
    </Suspense>
  );
}
