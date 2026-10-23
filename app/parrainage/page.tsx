import { ParrainageLandingContent } from "./ParrainageLandingContent";
import { LoadingLabel } from "@/components/ui/loading-label";
import { Suspense } from "react";

/** Landing publique parrainage → inscription avec code (`?c=` ou `/parrainage/CODE`). */
export default function ParrainageLandingPage() {
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
      <ParrainageLandingContent />
    </Suspense>
  );
}
