"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HELP_ACTIONS } from "@/lib/proto/helpActions";

export function HeaderHelpMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          title="Aide"
          aria-label="Aide"
          className="cursor-pointer rounded-xl text-base font-black shadow-sm"
        >
          ?
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(300px,calc(100vw-24px))] p-1.5"
        aria-label="Actions d'aide"
      >
        <DropdownMenuLabel className="px-3 pb-1 pt-2 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
          Aide
        </DropdownMenuLabel>
        {HELP_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.label}
              onSelect={() => action.onClick()}
              className="cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5"
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-foreground">
                  {action.label}
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-muted-foreground">
                  {action.description}
                </span>
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
