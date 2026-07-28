"use client";

import type { CampaignRowData } from "@/lib/types/campaign";
import type { ContactRowData } from "@/lib/types/contact";
import type { CustomFieldValues } from "@/lib/types/customFields";
import type { GroupRowData } from "@/lib/types/group";
import { formatFrPhoneInput } from "@/lib/proto/smsUtils";
import type { StatsPeriodPreset } from "@/lib/statsDateRanges";
import { startTransition, useCallback, useEffect, useState } from "react";
import type { AppRoute } from "@/lib/proto/routes";

export function usePrototypeModals(
  route: AppRoute,
  statsDefaults: { from: string; to: string }
) {
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupQuickFromContactOpen, setGroupQuickFromContactOpen] =
    useState(false);
  const [groupEditOpen, setGroupEditOpen] = useState(false);
  const [groupEditRow, setGroupEditRow] = useState<GroupRowData | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactModalMode, setContactModalMode] = useState<"add" | "edit">(
    "add"
  );
  const [contactEditRow, setContactEditRow] = useState<ContactRowData | null>(
    null
  );
  const [importContactsOpen, setImportContactsOpen] = useState(false);
  const [campaignDetailsOpen, setCampaignDetailsOpen] = useState(false);
  const [campaignDetailsRow, setCampaignDetailsRow] =
    useState<CampaignRowData | null>(null);

  const [cmFirst, setCmFirst] = useState("");
  const [cmLast, setCmLast] = useState("");
  const [cmPhone, setCmPhone] = useState("");
  const [cmBirthday, setCmBirthday] = useState("");
  const [cmNotes, setCmNotes] = useState("");
  const [cmCustomFields, setCmCustomFields] = useState<CustomFieldValues>({});
  const [cmGroups, setCmGroups] = useState<string[]>([]);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteTitle, setConfirmDeleteTitle] = useState("");
  const [confirmDeleteDesc, setConfirmDeleteDesc] = useState("");
  const [confirmDeleteAction, setConfirmDeleteAction] = useState<
    (() => Promise<void>) | null
  >(null);

  const [statsPeriod, setStatsPeriod] = useState<StatsPeriodPreset>("month");
  const [statsOpen, setStatsOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState(statsDefaults.from);
  const [dateTo, setDateTo] = useState(statsDefaults.to);
  const [appliedStatsFrom, setAppliedStatsFrom] = useState(statsDefaults.from);
  const [appliedStatsTo, setAppliedStatsTo] = useState(statsDefaults.to);

  const [qrWheelSaving, setQrWheelSaving] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    const anyModal =
      groupModalOpen ||
      groupQuickFromContactOpen ||
      groupEditOpen ||
      contactModalOpen ||
      importContactsOpen;
    document.body.style.overflow = anyModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [
    groupModalOpen,
    groupQuickFromContactOpen,
    groupEditOpen,
    contactModalOpen,
    importContactsOpen,
  ]);

  useEffect(() => {
    startTransition(() => {
      if (route !== "statistiques") setStatsOpen(false);
    });
  }, [route]);

  const openConfirmDelete = useCallback(
    (title: string, desc: string, action: () => Promise<void>) => {
      setConfirmDeleteTitle(title);
      setConfirmDeleteDesc(desc);
      setConfirmDeleteAction(() => action);
      setConfirmDeleteOpen(true);
    },
    []
  );

  const openContactAdd = useCallback(() => {
    setContactModalMode("add");
    setContactEditRow(null);
    setCmFirst("");
    setCmLast("");
    setCmPhone("");
    setCmBirthday("");
    setCmNotes("");
    setCmCustomFields({});
    setCmGroups([]);
    setContactModalOpen(true);
  }, []);

  const openContactEdit = useCallback((row: ContactRowData) => {
    setContactModalMode("edit");
    setContactEditRow(row);
    setCmFirst(row.firstName);
    setCmLast(row.lastName);
    setCmPhone(formatFrPhoneInput(row.phone));
    setCmBirthday(row.birthday);
    setCmNotes(row.notes);
    setCmCustomFields({ ...(row.customFields ?? {}) });
    setCmGroups([...row.groups]);
    setContactModalOpen(true);
  }, []);

  const openGroupEdit = useCallback((row: GroupRowData) => {
    setGroupEditRow(row);
    setGroupEditOpen(true);
  }, []);

  return {
    groupModalOpen,
    setGroupModalOpen,
    groupQuickFromContactOpen,
    setGroupQuickFromContactOpen,
    groupEditOpen,
    setGroupEditOpen,
    groupEditRow,
    setGroupEditRow,
    contactModalOpen,
    setContactModalOpen,
    contactModalMode,
    contactEditRow,
    importContactsOpen,
    setImportContactsOpen,
    campaignDetailsOpen,
    setCampaignDetailsOpen,
    campaignDetailsRow,
    setCampaignDetailsRow,
    cmFirst,
    setCmFirst,
    cmLast,
    setCmLast,
    cmPhone,
    setCmPhone,
    cmBirthday,
    setCmBirthday,
    cmNotes,
    setCmNotes,
    cmCustomFields,
    setCmCustomFields,
    cmGroups,
    setCmGroups,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    confirmDeleteTitle,
    confirmDeleteDesc,
    confirmDeleteAction,
    statsPeriod,
    setStatsPeriod,
    statsOpen,
    setStatsOpen,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    appliedStatsFrom,
    setAppliedStatsFrom,
    appliedStatsTo,
    setAppliedStatsTo,
    qrWheelSaving,
    setQrWheelSaving,
    feedbackOpen,
    setFeedbackOpen,
    openConfirmDelete,
    openContactAdd,
    openContactEdit,
    openGroupEdit,
  };
}

export type PrototypeModals = ReturnType<typeof usePrototypeModals>;
