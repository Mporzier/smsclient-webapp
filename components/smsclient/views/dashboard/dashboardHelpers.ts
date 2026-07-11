import type { CampaignRowData } from "@/lib/types/campaign";
import type { ContactRowData } from "@/lib/types/contact";
import type { GroupRowData } from "@/lib/types/group";
import type { LucideIcon } from "lucide-react";
import {
  Clock3,
  Megaphone,
  UserPlus,
  Users,
} from "lucide-react";

export type DashboardActivityItem = {
  icon: LucideIcon;
  title: string;
  description: string;
  tag: string;
  tagClassName: string;
  sortAt: number;
};

function isCurrentMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  );
}

export function countSentSms(campaigns: CampaignRowData[]): number {
  return campaigns
    .filter((c) => c.status === "sent")
    .reduce((sum, c) => sum + c.recipients, 0);
}

export function hasUserSentSms(campaigns: CampaignRowData[]): boolean {
  return campaigns.some((c) => c.status === "sent");
}

export function countSentSmsThisMonth(campaigns: CampaignRowData[]): number {
  return campaigns
    .filter((c) => c.status === "sent" && c.sentAt && isCurrentMonth(c.sentAt))
    .reduce((sum, c) => sum + c.recipients, 0);
}

export function countActiveGroups(groups: GroupRowData[]): number {
  return groups.filter((g) => g.contactCount > 0).length;
}

export function estimateSmsFromCredits(credits: number): number {
  return Math.max(0, credits * 10);
}

export function buildRecentActivities(
  campaigns: CampaignRowData[],
  contacts: ContactRowData[],
): DashboardActivityItem[] {
  const items: DashboardActivityItem[] = [];

  const latestSent = campaigns
    .filter((c) => c.status === "sent")
    .sort(
      (a, b) =>
        new Date(b.sentAt ?? b.createdAt ?? 0).getTime() -
        new Date(a.sentAt ?? a.createdAt ?? 0).getTime(),
    )[0];

  if (latestSent) {
    items.push({
      icon: Megaphone,
      title: "Campagne envoyée",
      description: `« ${latestSent.name} »\n${latestSent.sendLabel}`,
      tag: `${latestSent.recipients} destinataire${latestSent.recipients > 1 ? "s" : ""}`,
      tagClassName: "bg-[#eaf3ff] text-[#1648e8]",
      sortAt: new Date(latestSent.sentAt ?? latestSent.createdAt ?? 0).getTime(),
    });
  }

  const contactsByDay = new Map<string, number>();
  for (const c of contacts) {
    const day = c.created.trim();
    if (!day) continue;
    contactsByDay.set(day, (contactsByDay.get(day) ?? 0) + 1);
  }
  const latestContactDay = [...contactsByDay.entries()].sort((a, b) => {
    const parse = (label: string) => {
      const [d, m, y] = label.split("/").map(Number);
      return new Date(y, (m ?? 1) - 1, d ?? 1).getTime();
    };
    return parse(b[0]) - parse(a[0]);
  })[0];

  if (latestContactDay) {
    const [day, count] = latestContactDay;
    items.push({
      icon: UserPlus,
      title: "Contacts ajoutés",
      description: `Le ${day}`,
      tag: `+${count} nouveau${count > 1 ? "x" : ""}`,
      tagClassName: "bg-[#e8fff4] text-[#099a5c]",
      sortAt: Date.now(),
    });
  }

  const latestWithGroup = campaigns
    .filter((c) => (c.targetGroups?.length ?? 0) > 0)
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    )[0];

  if (latestWithGroup?.targetGroups?.[0]) {
    const groupName = latestWithGroup.targetGroups[0];
    items.push({
      icon: Users,
      title: "Groupe utilisé",
      description: `${groupName}\n${latestWithGroup.sendLabel}`,
      tag: `${latestWithGroup.recipients} contact${latestWithGroup.recipients > 1 ? "s" : ""}`,
      tagClassName: "bg-[#eaf3ff] text-[#1648e8]",
      sortAt: new Date(latestWithGroup.createdAt ?? 0).getTime(),
    });
  }

  const latestScheduled = campaigns
    .filter((c) => c.status === "scheduled")
    .sort(
      (a, b) =>
        new Date(b.scheduledAt ?? b.createdAt ?? 0).getTime() -
        new Date(a.scheduledAt ?? a.createdAt ?? 0).getTime(),
    )[0];

  if (latestScheduled) {
    items.push({
      icon: Clock3,
      title: "SMS planifié",
      description: `« ${latestScheduled.name} »\n${latestScheduled.sendLabel}`,
      tag: "Programmé",
      tagClassName: "bg-[#fff2dd] text-[#d36b00]",
      sortAt: new Date(
        latestScheduled.scheduledAt ?? latestScheduled.createdAt ?? 0,
      ).getTime(),
    });
  }

  return items
    .sort((a, b) => b.sortAt - a.sortAt)
    .slice(0, 4);
}
