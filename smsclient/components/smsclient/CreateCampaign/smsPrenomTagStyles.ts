import { cn } from "@/lib/cn";

/** Bouton d’insertion sous le composer. */
export const smsPrenomChipClass = cn(
  "inline-flex items-center rounded-md border border-[#2f6fed]/25 bg-[#eef4ff] px-1.5 py-0.5",
  "text-[11px] font-extrabold leading-none text-[#1f3b77]",
);

/** Bulle inline dans le message (contenteditable). */
export const smsPrenomBubbleClass = cn(
  "mx-0.5 inline-flex items-center rounded-full border border-[#2f6fed]/35",
  "bg-gradient-to-b from-[#eef4ff] to-[#dfe9ff] px-2.5 py-1",
  "text-[11px] font-extrabold leading-none text-[#1f3b77]",
  "align-middle shadow-[0_1px_2px_rgba(47,111,237,0.15)]",
  "selection:bg-[#2f6fed]/30",
);
