import { groupTagBase } from "@/lib/proto/contactDisplay";
import { formatContactGroups, type ContactRowData } from "@/lib/types/contact";
import type { GroupRowData } from "@/lib/types/group";
import { cn } from "@/lib/cn";
import { formatInt } from "@/lib/proto/smsUtils";
import type { ReactNode } from "react";

export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

export function frPhoneSearchKey(s: string): string {
  let d = digitsOnly(s);
  if (d.startsWith("33")) {
    const rest = d.slice(2);
    if (rest.length > 0) d = `0${rest}`;
  } else if (d.length === 9 && /^[67]/.test(d)) {
    d = `0${d}`;
  }
  return d;
}

export function contactMatchesSearch(c: ContactRowData, rawQuery: string): boolean {
  const qTrim = rawQuery.trim();
  if (!qTrim) return true;

  const qLower = qTrim.toLowerCase();
  const groupsText = formatContactGroups(c.groups).toLowerCase();
  const nameHay = [c.name, c.firstName, c.lastName]
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  const textHay = `${nameHay} ${c.phone.toLowerCase()} ${groupsText}`;

  if (textHay.includes(qLower)) return true;

  const terms = qLower.split(/\s+/).filter(Boolean);
  if (terms.length > 1 && terms.every((t) => textHay.includes(t))) {
    return true;
  }

  const qDigits = digitsOnly(qTrim);
  const qPhoneKey = frPhoneSearchKey(qTrim);
  const phoneKey = frPhoneSearchKey(c.phone);
  if (
    qDigits.length >= 2 &&
    phoneKey.length > 0 &&
    phoneKey.includes(qPhoneKey)
  ) {
    return true;
  }

  return false;
}

export function groupMatchesSearch(g: GroupRowData, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  return (
    g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
  );
}

export function normalizeGroupName(name: string): string {
  return name.trim().toLowerCase();
}

export function contactBelongsToGroup(c: ContactRowData, groupName: string): boolean {
  const wanted = normalizeGroupName(groupName);
  return c.groups.some((g) => normalizeGroupName(g) === wanted);
}

export function selectedGroupsForContact(
  contact: ContactRowData,
  selectedGroupNames: string[]
): string[] {
  return selectedGroupNames.filter((gName) =>
    contactBelongsToGroup(contact, gName)
  );
}

export const groupChipBase = cn(
  groupTagBase,
  "max-w-[7rem] truncate py-0.5 text-[10px] font-bold"
);

export function contactDisplayName(c: ContactRowData): string {
  const first = c.firstName.trim();
  const last = c.lastName.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return c.name.trim() || "—";
}

export function SummaryStatBubble({
  label,
  value,
  highlight,
  children,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5",
        highlight
          ? "border-[#2f6fed]/30 bg-[#eef4ff]"
          : "border-slate-200 bg-slate-50"
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "text-xs font-extrabold",
            highlight ? "text-[#1f3b77]" : "text-slate-700"
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "text-lg font-black tabular-nums",
            highlight ? "text-[#1f3b77]" : "text-slate-900"
          )}
        >
          {formatInt(value)}
        </span>
      </div>
      {children}
    </div>
  );
}

export function RecipientListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-3 px-3 py-2.5"
        >
          <div className="h-4 w-4 shrink-0 rounded bg-slate-200" />
          <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-2/5 max-w-[140px] rounded bg-slate-200" />
            <div className="h-3 w-3/5 max-w-[200px] rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
