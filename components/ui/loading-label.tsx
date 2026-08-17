import * as React from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type LoadingLabelProps = {
  children?: React.ReactNode;
  className?: string;
  spinnerClassName?: string;
};

/** Spinner shadcn + libellé — pattern unique pour loaders inline. */
export function LoadingLabel({
  children,
  className,
  spinnerClassName,
}: LoadingLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-2.5",
        className,
      )}
    >
      <Spinner className={cn("size-4 text-primary", spinnerClassName)} />
      {children}
    </span>
  );
}
