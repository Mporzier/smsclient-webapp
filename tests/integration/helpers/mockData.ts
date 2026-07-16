import type { ContactRowData } from "@/lib/types/contact";
import type { GroupRowData } from "@/lib/types/group";
import type { GroupModalContactRow } from "@/components/smsclient/modals/GroupModal";

let idCounter = 0;

export function resetMockIds() {
  idCounter = 0;
}

export function nextMockId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function makeContact(
  overrides: Partial<ContactRowData> = {},
): ContactRowData {
  const firstName = overrides.firstName ?? "Alice";
  const lastName = overrides.lastName ?? "Martin";
  const id = overrides.id ?? nextMockId("contact");
  return {
    id,
    created: "01/06/2025",
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(" "),
    phone: "06 12 34 56 78",
    groups: [],
    birthday: "",
    notes: "",
    customFields: {},
    lastSms: "—",
    lastSmsBody: "",
    unsubscribed: "",
    source: "Manuel",
    optIn: true,
    stopSms: false,
    ...overrides,
  };
}

export function makeGroup(overrides: Partial<GroupRowData> = {}): GroupRowData {
  const id = overrides.id ?? nextMockId("group");
  return {
    id,
    name: "Clients VIP",
    description: "Segment test",
    contactCount: 0,
    lastCampaignLabel: "—",
    createdLabel: "01/06/2025",
    ...overrides,
  };
}

export function contactToGroupModalRow(
  contact: ContactRowData,
): GroupModalContactRow {
  return {
    id: contact.id,
    name: contact.name,
    firstName: contact.firstName,
    lastName: contact.lastName,
    phone: contact.phone,
    groups: contact.groups,
  };
}
