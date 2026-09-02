"use client";

import {
  DashboardView,
  CampagnesView,
  ContactsView,
  GroupesView,
} from "@/components/smsclient/MainViews";
import {
  countClientIds,
  fetchClientIds,
} from "@/lib/supabase/clients";
import {
  countMatchingGroups,
  fetchMatchingGroups,
} from "@/lib/supabase/groups";
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
    user,
    supabase,
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
          onNewCampaign={() => modals.setCampaignNameOpen(true)}
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
          unsubscribedCount={data.unsubscribedCount}
          unsubscribedLoading={contactsState.unsubscribedLoading}
          onLoadUnsubscribed={data.loadUnsubscribed}
          onImport={() => modals.setImportContactsOpen(true)}
          onAddContact={modals.openContactAdd}
          onRowClick={modals.openContactEdit}
          onDeleteContacts={actions.handleDeleteContacts}
          onDeleteContactsMatching={actions.handleDeleteContactsMatching}
          onCreateCampaignFromContacts={(ids) =>
            wizard.openCampaignComposer({ contactIds: ids })
          }
          onResubscribeContacts={actions.handleResubscribeContacts}
          onCountSelectableMatches={(search) =>
            countClientIds(supabase, { search, eligibleOnly: true })
          }
          onFetchSelectableMatchIds={(search) =>
            fetchClientIds(supabase, { search, eligibleOnly: true })
          }
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
            void (async () => {
              if (!user?.id) return;
              const wanted = new Set(ids);
              const { data: matched, error } = await fetchMatchingGroups(
                supabase,
                user.id,
                { search: groupsState.searchInput },
              );
              const names = error
                ? groupsState.rows
                    .filter((g) => wanted.has(g.id))
                    .map((g) => g.name)
                : matched
                    .filter((g) => wanted.has(g.id))
                    .map((g) => g.name);
              wizard.openCampaignComposer({ groupNames: names });
            })();
          }}
          onCountSelectableMatches={(search) =>
            user?.id
              ? countMatchingGroups(supabase, user.id, { search })
              : Promise.resolve({ count: 0, error: null })
          }
          onFetchSelectableMatchIds={async (search) => {
            if (!user?.id) return { data: [], error: null };
            const { data: matched, error } = await fetchMatchingGroups(
              supabase,
              user.id,
              { search },
            );
            if (error) return { data: [], error };
            return { data: matched.map((g) => g.id), error: null };
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
          onNewCampaign={() => modals.setCampaignNameOpen(true)}
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
