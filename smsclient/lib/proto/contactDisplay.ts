const GROUP_COLORS: { bg: string; border: string; text: string }[] = [
  { bg: "bg-indigo-50", border: "border-indigo-100", text: "text-indigo-700" },
  {
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    text: "text-emerald-700",
  },
  { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-50", border: "border-rose-100", text: "text-rose-700" },
  { bg: "bg-sky-50", border: "border-sky-100", text: "text-sky-700" },
  { bg: "bg-violet-50", border: "border-violet-100", text: "text-violet-700" },
  { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-700" },
  { bg: "bg-cyan-50", border: "border-cyan-100", text: "text-cyan-700" },
  {
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-100",
    text: "text-fuchsia-700",
  },
  { bg: "bg-lime-50", border: "border-lime-100", text: "text-lime-700" },
];

const AVATAR_COLORS: { bg: string; text: string }[] = [
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-sky-100", text: "text-sky-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
];

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function avatarColor(id: string) {
  return AVATAR_COLORS[hashString(id) % AVATAR_COLORS.length];
}

export function groupColor(name: string) {
  return GROUP_COLORS[hashString(name) % GROUP_COLORS.length];
}

export function contactInitials(contact: {
  firstName?: string;
  lastName?: string;
  name?: string;
}): string {
  const f = (contact.firstName ?? "").trim();
  const l = (contact.lastName ?? "").trim();
  if (f || l) {
    return ((f[0] ?? "") + (l[0] ?? "")).toUpperCase() || "?";
  }
  const parts = (contact.name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (
      (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")
    ).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase() || "?";
  }
  return "?";
}

export const groupTagBase =
  "inline-flex items-center rounded-[10px] border px-2 py-0.5 text-[11px] font-medium";
