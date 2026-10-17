"use client";

import { cn } from "@/lib/utils";
import {
  normalizeSmsLinkIconId,
  smsLinkIconMeta,
  type SmsLinkIconId,
} from "@/lib/proto/smsLinkIcons";

const sizeCls = {
  sm: "size-8 rounded-lg [&_svg]:size-4",
  md: "size-9 rounded-lg [&_svg]:size-4",
  /** Remplit le bouton picker (taille fluide, max 36px). */
  picker: "size-full rounded-lg [&_svg]:size-[clamp(0.8125rem,42%,1rem)]",
} as const;

type SmsLinkIconTileProps = {
  iconId: SmsLinkIconId | string;
  size?: keyof typeof sizeCls;
  selected?: boolean;
  className?: string;
  title?: string;
};

export function SmsLinkIconTile({
  iconId,
  size = "sm",
  selected = false,
  className,
  title,
}: SmsLinkIconTileProps) {
  const id = normalizeSmsLinkIconId(iconId);
  const { Icon, tileBg, tileIcon, labelFr } = smsLinkIconMeta(id);
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center",
        sizeCls[size],
        tileBg,
        !selected && "ring-1 ring-black/5 dark:ring-white/10",
        selected &&
          "ring-2 ring-inset ring-foreground/55 dark:ring-foreground/65",
        className,
      )}
      title={title ?? labelFr}
    >
      <Icon className={cn(tileIcon)} strokeWidth={2} aria-hidden />
    </span>
  );
}
