"use client";

import { GroupesView } from "@/components/smsclient/views/GroupesView";
import { GroupModal } from "@/components/smsclient/modals/GroupModal";
import { ConfirmDeleteModal } from "@/components/smsclient/modals/ConfirmDeleteModal";
import type { ContactRowData } from "@/lib/types/contact";
import type { GroupRowData } from "@/lib/types/group";
import { useCallback, useMemo, useState } from "react";
import {
  contactToGroupModalRow,
  nextMockId,
} from "../helpers/mockData";

type GroupesFlowHarnessProps = {
  initialGroups?: GroupRowData[];
  initialContacts?: ContactRowData[];
  onCreateCampaign?: (ids: string[]) => void;
};

export function GroupesFlowHarness({
  initialGroups = [],
  initialContacts = [],
  onCreateCampaign,
}: GroupesFlowHarnessProps) {
  const [groups, setGroups] = useState<GroupRowData[]>(initialGroups);
  const [contacts, setContacts] = useState<ContactRowData[]>(initialContacts);
  const [createOpen, setCreateOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<GroupRowData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  const modalContacts = useMemo(
    () => contacts.map(contactToGroupModalRow),
    [contacts],
  );

  const syncContactMembership = useCallback(
    (groupName: string, selectedContactIds: string[]) => {
      const idSet = new Set(selectedContactIds);
      setContacts((prev) =>
        prev.map((contact) => {
          const inGroup = idSet.has(contact.id);
          const hasGroup = contact.groups.includes(groupName);
          if (inGroup && !hasGroup) {
            return { ...contact, groups: [...contact.groups, groupName] };
          }
          if (!inGroup && hasGroup) {
            return {
              ...contact,
              groups: contact.groups.filter((g) => g !== groupName),
            };
          }
          return contact;
        }),
      );
    },
    [],
  );

  const onCreated = useCallback(
    async (name: string, description: string, selectedContactIds: string[]) => {
      const id = nextMockId("group");
      setGroups((prev) => [
        ...prev,
        {
          id,
          name,
          description,
          contactCount: selectedContactIds.length,
          lastCampaignLabel: "—",
          createdLabel: "17/06/2025",
        },
      ]);
      syncContactMembership(name, selectedContactIds);
    },
    [syncContactMembership],
  );

  const onSave = useCallback(
    async (payload: {
      id: string;
      name: string;
      description: string;
      selectedContactIds: string[];
    }) => {
      const previous = groups.find((g) => g.id === payload.id);
      setGroups((prev) =>
        prev.map((group) =>
          group.id === payload.id
            ? {
                ...group,
                name: payload.name,
                description: payload.description,
                contactCount: payload.selectedContactIds.length,
              }
            : group,
        ),
      );
      if (previous) {
        syncContactMembership(payload.name, payload.selectedContactIds);
      }
    },
    [groups, syncContactMembership],
  );

  const onDeleteGroups = useCallback((ids: string[]) => {
    setPendingDeleteIds(ids);
    setConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    const toDelete = groups.filter((g) => pendingDeleteIds.includes(g.id));
    setGroups((prev) =>
      prev.filter((group) => !pendingDeleteIds.includes(group.id)),
    );
    for (const group of toDelete) {
      syncContactMembership(group.name, []);
    }
    setConfirmOpen(false);
    setPendingDeleteIds([]);
  }, [groups, pendingDeleteIds, syncContactMembership]);

  const n = pendingDeleteIds.length;

  return (
    <>
      <GroupesView
        rows={groups}
        loading={false}
        error={null}
        onCreateGroup={() => setCreateOpen(true)}
        onEditGroup={setEditGroup}
        onDeleteGroups={onDeleteGroups}
        onCreateCampaignFromGroups={(ids) => onCreateCampaign?.(ids)}
      />

      <GroupModal
        mode="create"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        contacts={modalContacts}
        onCreated={onCreated}
      />

      <GroupModal
        mode="edit"
        open={editGroup !== null}
        group={editGroup}
        onClose={() => setEditGroup(null)}
        contacts={modalContacts}
        onSave={onSave}
        onLaunchCampaign={() => {}}
        onDeleteGroup={
          editGroup
            ? () => {
                setEditGroup(null);
                onDeleteGroups([editGroup.id]);
              }
            : undefined
        }
      />

      <ConfirmDeleteModal
        open={confirmOpen}
        title={`Supprimer ${n} groupe${n > 1 ? "s" : ""} ?`}
        description="Le groupe sera retiré de vos listes."
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingDeleteIds([]);
        }}
      />
    </>
  );
}
