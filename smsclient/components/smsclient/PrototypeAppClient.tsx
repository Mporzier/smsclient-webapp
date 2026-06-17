"use client";

import dynamic from "next/dynamic";

const PrototypeApp = dynamic(
  () =>
    import("@/components/smsclient/PrototypeApp").then((mod) => mod.PrototypeApp),
  { ssr: false },
);

export function PrototypeAppClient() {
  return <PrototypeApp />;
}
