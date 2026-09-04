"use client";

import { useProtoNavigation } from "@/hooks/useProtoNavigation";
import { profileToForm } from "@/lib/supabase/profile";
import { useStatistics } from "@/hooks/useStatistics";
import { useCallback } from "react";
import { useCampaignWizard } from "./useCampaignWizard";
import { usePrototypeActions } from "./usePrototypeActions";
import { usePrototypeData } from "./usePrototypeData";
import { usePrototypeModals } from "./usePrototypeModals";

export function usePrototypeApp() {
  const { route, go } = useProtoNavigation();
  const data = usePrototypeData(route);
  const modals = usePrototypeModals(route, {
    from: data.statsDefaultFrom,
    to: data.statsDefaultTo,
  });

  const statisticsState = useStatistics(
    {
      from: modals.appliedStatsFrom,
      to: modals.appliedStatsTo,
    },
    route === "statistiques",
  );

  const onCampaignSaved = useCallback(async () => {
    await data.campaignsState.refresh();
    await data.contactsState.refresh();
  }, [data.campaignsState, data.contactsState]);

  const wizard = useCampaignWizard({
    route,
    go,
    smsSender: data.profileState.smsSender,
    contacts: data.contactsState.rows,
    groupRows: data.groupsState.rows,
    groupsLoading: data.groupsState.loading,
    groupsLoadingMore: data.groupsState.loadingMore,
    groupsHasMore: data.groupsState.hasMore,
    onGroupsLoadMore: data.groupsState.loadMore,
    groupsSearchQuery: data.groupsState.searchInput,
    onGroupsSearchChange: data.groupsState.setSearchInput,
    contactsLoading: data.contactsState.loading,
    contactsLoadingMore: data.contactsState.loadingMore,
    contactsHasMore: data.contactsState.hasMore,
    onContactsLoadMore: data.contactsState.loadMore,
    contactsSearchQuery: data.contactsState.searchInput,
    onContactsSearchChange: data.contactsState.setSearchInput,
    contactsTotalCount: data.contactsState.totalCount,
    groupsTotalCount: data.groupsState.totalCount,
    creditsBalance: data.creditsState.balance,
    supabase: data.supabase,
    userId: data.user?.id,
    customFieldDefs: data.customFieldsState.defs,
    onCampaignSaved,
  });

  const actions = usePrototypeActions({ data, modals });

  return {
    route,
    go,
    data,
    modals,
    wizard,
    actions,
    statisticsState,
    profileToForm,
  };
}

export type PrototypeAppContext = ReturnType<typeof usePrototypeApp>;
