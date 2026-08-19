"use client";

import { ContactsView } from "@/components/smsclient/views/ContactsView";
import { ContactCreateModal } from "@/components/smsclient/modals/ContactCreateModal";
import { ConfirmDeleteModal } from "@/components/smsclient/modals/ConfirmDeleteModal";
import type { ContactFormSubmitPayload } from "@/lib/supabase/clients";
import type { ContactRowData } from "@/lib/types/contact";
import type { CustomFieldValues } from "@/lib/types/customFields";
import type { ContactGroupOption } from "@/lib/types/group";
import { formatFrPhoneInput } from "@/lib/proto/smsUtils";
import type { SortingState } from "@tanstack/react-table";
import { useCallback, useMemo, useRef, useState } from "react";
import { nextMockId } from "../helpers/mockData";

type ContactsFlowHarnessProps = {
  initialRows?: ContactRowData[];
  groupOptions?: ContactGroupOption[] | string[];
  onCreateCampaign?: (ids: string[]) => void;
};

export function ContactsFlowHarness({
  initialRows = [],
  groupOptions = [],
  onCreateCampaign,
}: ContactsFlowHarnessProps) {
  const normalizedGroupOptions = useMemo<ContactGroupOption[]>(
    () =>
      groupOptions.map((g) =>
        typeof g === "string" ? { name: g, contactCount: 0 } : g,
      ),
    [groupOptions],
  );
  const [rows, setRows] = useState<ContactRowData[]>(initialRows);
  const [searchQuery, setSearchQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editRow, setEditRow] = useState<ContactRowData | null>(null);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [notes, setNotes] = useState("");
  const [customFields, setCustomFields] = useState<CustomFieldValues>({});
  const [groups, setGroups] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [pendingDeleteCount, setPendingDeleteCount] = useState(0);
  const pendingResolveRef = useRef<(() => Promise<string[]>) | null>(null);

  const openAdd = useCallback(() => {
    setModalMode("add");
    setEditRow(null);
    setFirst("");
    setLast("");
    setPhone("");
    setBirthday("");
    setNotes("");
    setCustomFields({});
    setGroups([]);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((row: ContactRowData) => {
    setModalMode("edit");
    setEditRow(row);
    setFirst(row.firstName);
    setLast(row.lastName);
    setPhone(formatFrPhoneInput(row.phone));
    setBirthday(row.birthday);
    setNotes(row.notes);
    setCustomFields({ ...(row.customFields ?? {}) });
    setGroups([...row.groups]);
    setModalOpen(true);
  }, []);

  const payloadToRow = useCallback(
    (payload: ContactFormSubmitPayload, id: string): ContactRowData => ({
      id,
      created: "17/06/2025",
      createdAt: "2025-06-17T10:00:00.000Z",
      firstName: payload.firstName,
      lastName: payload.lastName,
      name: [payload.firstName, payload.lastName].filter(Boolean).join(" "),
      phone: payload.phoneDisplay,
      groups: payload.groupLabels,
      birthday: payload.birthday,
      notes: payload.notes,
      customFields: payload.customFields ?? {},
      lastSms: "—",
      lastSmsAt: null,
      lastSmsBody: "",
      unsubscribed: "",
      source: "Manuel",
      optIn: payload.optIn,
      stopSms: payload.stop,
    }),
    [],
  );

  const onSaveContact = useCallback(
    async (payload: ContactFormSubmitPayload) => {
      if (modalMode === "add") {
        const id = nextMockId("contact");
        setRows((prev) => [...prev, payloadToRow(payload, id)]);
        return;
      }
      if (!editRow) return;
      setRows((prev) =>
        prev.map((row) =>
          row.id === editRow.id ? payloadToRow(payload, row.id) : row,
        ),
      );
    },
    [modalMode, editRow, payloadToRow],
  );

  const onDeleteContacts = useCallback(
    (
      idsOrResolve: string[] | (() => Promise<string[]>),
      countHint?: number,
    ) => {
      if (Array.isArray(idsOrResolve)) {
        pendingResolveRef.current = null;
        setPendingDeleteIds(idsOrResolve);
        setPendingDeleteCount(countHint ?? idsOrResolve.length);
      } else {
        pendingResolveRef.current = idsOrResolve;
        setPendingDeleteIds([]);
        setPendingDeleteCount(countHint ?? 0);
      }
      setConfirmOpen(true);
    },
    [],
  );

  const confirmDelete = useCallback(async () => {
    const resolve = pendingResolveRef.current;
    const ids = resolve ? await resolve() : pendingDeleteIds;
    setRows((prev) => prev.filter((row) => !ids.includes(row.id)));
    setConfirmOpen(false);
    setPendingDeleteIds([]);
    setPendingDeleteCount(0);
    pendingResolveRef.current = null;
  }, [pendingDeleteIds]);

  const n = pendingDeleteCount;

  return (
    <>
      <ContactsView
        rows={rows}
        loading={false}
        error={null}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sorting={sorting}
        onSortingChange={setSorting}
        onImport={() => {}}
        onAddContact={openAdd}
        onRowClick={openEdit}
        onDeleteContacts={onDeleteContacts}
        onCreateCampaignFromContacts={(ids) => onCreateCampaign?.(ids)}
      />

      <ContactCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode === "add" ? "add" : "edit"}
        first={first}
        last={last}
        phone={phone}
        birthday={birthday}
        notes={notes}
        customFields={customFields}
        groups={groups}
        setGroups={setGroups}
        groupOptions={normalizedGroupOptions}
        onCreateGroupRequest={() => {}}
        consentDefaults={
          editRow
            ? { optIn: editRow.optIn, stop: editRow.stopSms }
            : undefined
        }
        onSaveContact={onSaveContact}
        onDeleteContact={
          modalMode === "edit" && editRow
            ? () => {
                setModalOpen(false);
                onDeleteContacts([editRow.id]);
              }
            : undefined
        }
      />

      <ConfirmDeleteModal
        open={confirmOpen}
        title={`Supprimer ${n} contact${n > 1 ? "s" : ""} ?`}
        description="Le contact sera retiré de vos listes."
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingDeleteIds([]);
        }}
      />
    </>
  );
}
