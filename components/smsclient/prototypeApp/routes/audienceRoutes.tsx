"use client";

import {
  DashboardView,
  CampagnesView,
  ContactsView,
  GroupesView,
} from "@/components/smsclient/MainViews";
import type { AppRoute } from "@/lib/proto/routes";
import type { ReactNode } from "react";
import type { PrototypeAppContext } from "../usePrototypeApp";

const AUDIENCE_ROUTES = new Set<AppRoute>([
  "dashboard",
  "contacts",
  "groupes",
  "campagnes",
]);

export function renderAudienceRoute(
  r: AppRoute,
  ctx: PrototypeAppContext
): ReactNode | null {
  if (!AUDIENCE_ROUTES.has(r)) return null;
  const { data, modals, wizard, actions } = ctx;
  const {
    contactsState,
    customFieldsState,
    groupsState,
    campaignsState,
    creditsState,
  } = data;

  switch (r) {
    case "dashboard":
      return (
        <DashboardView
          creditsLabel={
            creditsState.loading ? undefined : creditsState.balanceLabel
          }
          creditsBalance={creditsState.balance}
          contactsCount={
            contactsState.totalCount ?? contactsState.rows.length
          }
          groupsCount={groupsState.totalCount ?? groupsState.rows.length}
          campaignRows={campaignsState.rows}
          groupRows={groupsState.rows}
          contacts={contactsState.rows}
          contactsLoading={contactsState.loading}
          campaignsLoading={campaignsState.loading}
          onNewCampaign={() => wizard.openCampaignComposer()}
          onGo={wizard.guardedGo}
        />
      );
    case "contacts":
      return (
        <ContactsView
          rows={contactsState.rows}
          loading={contactsState.loading}
          loadingMore={contactsState.loadingMore}
          hasMore={contactsState.hasMore}
          onLoadMore={contactsState.loadMore}
          totalCount={contactsState.totalCount}
          searchQuery={contactsState.searchInput}
          onSearchChange={contactsState.setSearchInput}
          sorting={contactsState.sorting}
          onSortingChange={contactsState.setSorting}
          error={contactsState.error}
          customFieldDefs={customFieldsState.defs}
          unsubscribedContacts={data.unsubscribedContacts}
          onImport={() => modals.setImportContactsOpen(true)}
          onAddContact={modals.openContactAdd}
          onRowClick={modals.openContactEdit}
          onDeleteContacts={actions.handleDeleteContacts}
          onCreateCampaignFromContacts={(ids) =>
            wizard.openCampaignComposer({ contactIds: ids })
          }
          onResubscribeContacts={actions.handleResubscribeContacts}
        />
      );
    case "groupes":
      return (
        <GroupesView
          rows={groupsState.rows}
          loading={groupsState.loading}
          loadingMore={groupsState.loadingMore}
          hasMore={groupsState.hasMore}
          onLoadMore={groupsState.loadMore}
          totalCount={groupsState.totalCount}
          searchQuery={groupsState.searchInput}
          onSearchChange={groupsState.setSearchInput}
          sorting={groupsState.sorting}
          onSortingChange={groupsState.setSorting}
          error={groupsState.error}
          onCreateGroup={() => modals.setGroupModalOpen(true)}
          onEditGroup={modals.openGroupEdit}
          onDeleteGroups={actions.handleDeleteGroups}
          onCreateCampaignFromGroups={(ids) => {
            const names = groupsState.rows
              .filter((g) => ids.includes(g.id))
              .map((g) => g.name);
            wizard.openCampaignComposer({ groupNames: names });
          }}
        />
      );
    case "campagnes":
      return (
        <CampagnesView
          rows={campaignsState.rows}
          loading={campaignsState.loading}
          loadingMore={campaignsState.loadingMore}
          hasMore={campaignsState.hasMore}
          onLoadMore={campaignsState.loadMore}
          totalCount={campaignsState.totalCount}
          searchQuery={campaignsState.searchInput}
          onSearchChange={campaignsState.setSearchInput}
          sorting={campaignsState.sorting}
          onSortingChange={campaignsState.setSorting}
          error={campaignsState.error}
          onNewCampaign={() => wizard.openCampaignComposer()}
          onOpenDetails={(row) => {
            modals.setCampaignDetailsRow(row);
            modals.setCampaignDetailsOpen(true);
          }}
        />
      );
    default:
      return null;
  }
}
