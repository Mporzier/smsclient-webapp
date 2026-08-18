"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { CheckIcon, MinusIcon } from "lucide-react";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 cursor-pointer rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary aria-invalid:border-destructive aria-invalid:ring-0",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

type CheckboxVisualState = boolean | "indeterminate";

/** Rendu `span` — pour l'intérieur d'un `button` (imbrication `button` interdite). */
function CheckboxVisual({
  checked = false,
  className,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & {
  checked?: CheckboxVisualState;
}) {
  const state =
    checked === "indeterminate"
      ? "indeterminate"
      : checked
        ? "checked"
        : "unchecked";

  return (
    <span
      data-slot="checkbox"
      data-state={state}
      aria-hidden
      className={cn(
        "peer grid size-4 shrink-0 place-content-center rounded-[4px] border border-input shadow-xs transition-shadow dark:bg-input/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground dark:data-[state=checked]:bg-primary",
        className
      )}
      {...props}
    >
      {state === "checked" && <CheckIcon className="size-3.5" />}
      {state === "indeterminate" && <MinusIcon className="size-3.5" />}
    </span>
  );
}

export { Checkbox, CheckboxVisual };
