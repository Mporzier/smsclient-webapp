import { cn } from "@/lib/cn";
import type { SmsRegulationCountry } from "@/lib/proto/smsRegulations";
import type { JSX } from "react";

type CountryFlagProps = {
  country: SmsRegulationCountry;
  className?: string;
  title?: string;
};

function FlagFrance() {
  return (
    <svg viewBox="0 0 3 2" className="h-full w-full" aria-hidden>
      <rect width="1" height="2" fill="#002395" />
      <rect x="1" width="1" height="2" fill="#FFFFFF" />
      <rect x="2" width="1" height="2" fill="#EF4135" />
    </svg>
  );
}

function FlagBelgium() {
  return (
    <svg viewBox="0 0 3 2" className="h-full w-full" aria-hidden>
      <rect width="1" height="2" fill="#000000" />
      <rect x="1" width="1" height="2" fill="#FDDA24" />
      <rect x="2" width="1" height="2" fill="#EF3340" />
    </svg>
  );
}

function FlagSwitzerland() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
      <rect width="32" height="32" fill="#DA291C" />
      <rect x="13" y="6" width="6" height="20" fill="#FFFFFF" />
      <rect x="6" y="13" width="20" height="6" fill="#FFFFFF" />
    </svg>
  );
}

const FLAG_BY_COUNTRY: Record<
  SmsRegulationCountry,
  { Component: () => JSX.Element; label: string }
> = {
  fr: { Component: FlagFrance, label: "France" },
  be: { Component: FlagBelgium, label: "Belgique" },
  ch: { Component: FlagSwitzerland, label: "Suisse" },
};

export function CountryFlag({ country, className, title }: CountryFlagProps) {
  const { Component, label } = FLAG_BY_COUNTRY[country];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-md border border-slate-200/80 bg-white shadow-sm",
        className,
      )}
      role="img"
      aria-label={title ?? `Drapeau ${label}`}
    >
      <Component />
    </span>
  );
}
