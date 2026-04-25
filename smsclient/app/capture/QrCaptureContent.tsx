"use client";

import { QrCapturePage } from "@/components/public/QrCapturePage";
import { useSearchParams } from "next/navigation";

/**
 * Le slug vient de l’URL en query (`?s=…`) pour rester compatible avec
 * `output: "export"` (pas de segment dynamique au build).
 */
export function QrCaptureContent() {
  const sp = useSearchParams();
  const slug = sp.get("s") ?? sp.get("slug") ?? "";
  return <QrCapturePage slug={slug} />;
}
