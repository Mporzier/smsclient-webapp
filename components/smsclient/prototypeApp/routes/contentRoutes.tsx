"use client";

import {
  AideView,
  AutomatisationsView,
  LiensView,
  ModelesSmsView,
  ReglementationsSmsView,
  StatistiquesView,
} from "@/components/smsclient/MainViews";
import type { AppRoute } from "@/lib/proto/routes";
import type { ReactNode } from "react";
import { toast } from "@/components/ui/sonner";
import type { PrototypeAppContext } from "../usePrototypeApp";

const CONTENT_ROUTES = new Set<AppRoute>([
  "automatisations",
  "statistiques",
  "liens",
  "modeles-sms",
  "reglementations-sms",
  "aide",
]);

export function renderContentRoute(
  r: AppRoute,
  ctx: PrototypeAppContext
): ReactNode | null {
  if (!CONTENT_ROUTES.has(r)) return null;
  const { data, modals, actions, statisticsState } = ctx;
  const {
    contactsState,
    linksState,
    smsTemplatesState,
    automationsState,
    unsubscribedContacts,
    customFieldsState,
  } = data;

  switch (r) {
    case "automatisations":
      return (
        <AutomatisationsView
          rows={automationsState.rows}
          contacts={contactsState.rows}
          loading={automationsState.loading}
          error={automationsState.error}
          onSave={actions.handleAutomationSave}
        />
      );
    case "statistiques":
      return (
        <StatistiquesView
          statsPeriod={modals.statsPeriod}
          appliedDateFrom={modals.appliedStatsFrom}
          appliedDateTo={modals.appliedStatsTo}
          onSelectPeriod={actions.applyStatsPreset}
          statsOpen={modals.statsOpen}
          setStatsOpen={modals.setStatsOpen}
          dateFrom={modals.dateFrom}
          dateTo={modals.dateTo}
          setDateFrom={modals.setDateFrom}
          setDateTo={modals.setDateTo}
          applyRange={actions.applyStatsRange}
          loading={statisticsState.loading}
          error={statisticsState.error}
          data={statisticsState.data}
          onExport={() =>
            toast("Export des statistiques (à implémenter).")
          }
          unsubscribedContacts={unsubscribedContacts}
          unsubscribedLoading={contactsState.unsubscribedLoading}
          onLoadUnsubscribed={data.loadUnsubscribed}
        />
      );
    case "liens":
      return (
        <LiensView
          rows={linksState.rows}
          loading={linksState.loading}
          loadingMore={linksState.loadingMore}
          hasMore={linksState.hasMore}
          onLoadMore={linksState.loadMore}
          totalCount={linksState.totalCount}
          searchQuery={linksState.searchInput}
          onSearchChange={linksState.setSearchInput}
          sorting={linksState.sorting}
          onSortingChange={linksState.setSorting}
          error={linksState.error}
          supabase={linksState.supabase}
          userId={linksState.userId}
          onRefresh={linksState.refresh}
        />
      );
    case "modeles-sms":
      return (
        <ModelesSmsView
          rows={smsTemplatesState.rows}
          loading={smsTemplatesState.loading}
          loadingMore={smsTemplatesState.loadingMore}
          hasMore={smsTemplatesState.hasMore}
          onLoadMore={smsTemplatesState.loadMore}
          totalCount={smsTemplatesState.totalCount}
          searchQuery={smsTemplatesState.searchInput}
          onSearchChange={smsTemplatesState.setSearchInput}
          sorting={smsTemplatesState.sorting}
          onSortingChange={smsTemplatesState.setSorting}
          error={smsTemplatesState.error}
          supabase={smsTemplatesState.supabase}
          userId={smsTemplatesState.userId}
          onRefresh={smsTemplatesState.refresh}
          customFieldDefs={customFieldsState.defs}
        />
      );
    case "reglementations-sms":
      return <ReglementationsSmsView />;
    case "aide":
      return <AideView onGo={ctx.go} />;
    default:
      return null;
  }
}
