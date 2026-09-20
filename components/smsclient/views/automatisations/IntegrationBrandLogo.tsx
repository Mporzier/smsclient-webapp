"use client";

import { integrationLogoUrl } from "@/lib/automations/integrationLogoSources";
import { integrationIconForCategory } from "@/lib/automations/integrationIcons";
import { cn } from "@/lib/utils";
import { createElement } from "react";

export type IntegrationBrandLogoProps = {
  integrationId: string;
  category: string;
  label: string;
  className?: string;
};

export function IntegrationBrandLogo({
  integrationId,
  category,
  label,
  className,
}: IntegrationBrandLogoProps) {
  const logoUrl = integrationLogoUrl(integrationId);

  return (
    <span
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-white p-1.5 shadow-sm",
        className,
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logos externes hétérogènes (SVG / favicon)
        <img
          src={logoUrl}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />
      ) : (
        createElement(integrationIconForCategory(category), {
          className: "h-5 w-5 text-violet-700",
          strokeWidth: 2.1,
          "aria-label": label,
        })
      )}
    </span>
  );
}
