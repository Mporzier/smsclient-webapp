import { LoadingLabel } from "@/components/ui/loading-label";
import { groupTagBase } from "@/lib/proto/contactDisplay";
import { formatContactGroups, type ContactRowData } from "@/lib/types/contact";
import type { GroupRowData } from "@/lib/types/group";
import { cn } from "@/lib/cn";

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

export function RecipientListSkeleton({ rows = 6 }: { rows?: number }) {
  void rows;
  return (
    <div className="flex min-h-[160px] items-center justify-center px-3 py-8 text-sm font-semibold text-muted-foreground">
      <LoadingLabel>Chargement…</LoadingLabel>
    </div>
  );
}
