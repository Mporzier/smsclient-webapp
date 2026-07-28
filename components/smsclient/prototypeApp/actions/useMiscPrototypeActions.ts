"use client";

import { upsertAutomation } from "@/lib/supabase/automations";
import { restoreClients, restoreGroups } from "@/lib/supabase/trash";
import type { AutomationSavePayload } from "@/lib/types/automation";
import type { StatsPeriodPreset } from "@/lib/statsDateRanges";
import { statsPeriodRange } from "@/lib/statsDateRanges";
import { useCallback } from "react";
import { toast } from "@/components/ui/sonner";
import type { ActionsContext } from "./types";

export function useMiscPrototypeActions({ data, modals }: ActionsContext) {
  const { user, supabase, contactsState, groupsState, automationsState } =
    data;
  const {
    dateFrom,
    dateTo,
    setStatsPeriod,
    setStatsOpen,
    setDateFrom,
    setDateTo,
    setAppliedStatsFrom,
    setAppliedStatsTo,
  } = modals;

  const handleRestoreTrashContacts = useCallback(
    async (ids: string[]) => {
      if (!user?.id) throw new Error("Vous devez être connecté.");
      const { restored, error } = await restoreClients(supabase, user.id, ids);
      if (error) throw error;
      contactsState.refresh();
      toast(
        `${restored} contact${restored > 1 ? "s" : ""} restauré${
          restored > 1 ? "s" : ""
        }.`
      );
    },
    [supabase, user, contactsState]
  );

  const handleRestoreTrashGroups = useCallback(
    async (ids: string[]) => {
      if (!user?.id) throw new Error("Vous devez être connecté.");
      const { restored, error } = await restoreGroups(supabase, user.id, ids);
      if (error) throw error;
      groupsState.refresh();
      toast(
        `${restored} groupe${restored > 1 ? "s" : ""} restauré${
          restored > 1 ? "s" : ""
        }.`
      );
    },
    [supabase, user, groupsState]
  );

  const handleAutomationSave = useCallback(
    async (payload: AutomationSavePayload) => {
      if (!user?.id) {
        throw new Error(
          "Vous devez être connecté pour enregistrer une automatisation."
        );
      }
      const { error } = await upsertAutomation(supabase, user.id, payload);
      if (error) throw error;
      await automationsState.refresh();
      toast(
        payload.enabled
          ? "Automatisation activée."
          : "Automatisation enregistrée."
      );
    },
    [user, supabase, automationsState]
  );

  const applyStatsPreset = useCallback(
    (preset: Exclude<StatsPeriodPreset, "custom">) => {
      const { from, to } = statsPeriodRange(preset);
      setDateFrom(from);
      setDateTo(to);
      setAppliedStatsFrom(from);
      setAppliedStatsTo(to);
      setStatsPeriod(preset);
      setStatsOpen(false);
    },
    [
      setDateFrom,
      setDateTo,
      setAppliedStatsFrom,
      setAppliedStatsTo,
      setStatsPeriod,
      setStatsOpen,
    ]
  );

  const applyStatsRange = useCallback(() => {
    setAppliedStatsFrom(dateFrom);
    setAppliedStatsTo(dateTo);
    setStatsPeriod("custom");
    setStatsOpen(false);
  }, [
    dateFrom,
    dateTo,
    setAppliedStatsFrom,
    setAppliedStatsTo,
    setStatsPeriod,
    setStatsOpen,
  ]);

  return {
    handleRestoreTrashContacts,
    handleRestoreTrashGroups,
    handleAutomationSave,
    applyStatsPreset,
    applyStatsRange,
  };
}
