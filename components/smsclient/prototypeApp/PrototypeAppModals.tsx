"use client";

import { ImportContactsModal } from "@/components/smsclient/ImportContactsModal";
import { CampaignWizardLeaveConfirmModal } from "@/components/smsclient/modals/CampaignWizardLeaveConfirmModal";
import { SoumettreAvisModal } from "@/components/smsclient/modals/SoumettreAvisModal";
import {
  CampaignDetailsModal,
  ConfirmDeleteModal,
  ContactCreateModal,
  GroupModal,
  GroupQuickCreateModal,
} from "@/components/smsclient/PrototypeModals";
import type { PrototypeAppContext } from "./usePrototypeApp";
import { useGroupModalContacts } from "@/hooks/useGroupModalContacts";

type Props = {
  ctx: PrototypeAppContext;
};

export function PrototypeAppModals({ ctx }: Props) {
  const { data, modals, wizard, actions } = ctx;
  const {
    contactsState,
    customFieldsState,
    groupsState,
    groupOptions,
    user,
    supabase,
  } = data;
  const {
    pendingWizardLeaveActionRef,
    setLeaveWizardConfirmOpen,
    leaveWizardConfirmOpen,
    confirmWizardLeave,
  } = wizard;

  const groupModalOpen = modals.groupModalOpen || modals.groupEditOpen;
  const editGroupId = modals.groupEditOpen ? modals.groupEditRow?.id : null;
  const groupModalContacts = useGroupModalContacts(
    groupModalOpen,
    editGroupId,
  );

  return (
    <>
      <GroupModal
        mode="create"
        open={modals.groupModalOpen}
        onClose={() => modals.setGroupModalOpen(false)}
        contacts={groupModalContacts.contacts}
        contactsLoading={groupModalContacts.loading}
        contactsLoadingMore={groupModalContacts.loadingMore}
        contactsHasMore={groupModalContacts.hasMore}
        onContactsLoadMore={groupModalContacts.loadMore}
        contactsTotalCount={groupModalContacts.totalCount}
        searchQuery={groupModalContacts.searchInput}
        onSearchChange={groupModalContacts.setSearchInput}
        onCreated={actions.onGroupCreatedFromModal}
      />
      <GroupModal
        mode="edit"
        open={modals.groupEditOpen}
        group={modals.groupEditRow}
        contacts={groupModalContacts.contacts}
        contactsLoading={groupModalContacts.loading}
        contactsLoadingMore={groupModalContacts.loadingMore}
        contactsHasMore={groupModalContacts.hasMore}
        onContactsLoadMore={groupModalContacts.loadMore}
        contactsTotalCount={groupModalContacts.totalCount}
        searchQuery={groupModalContacts.searchInput}
        onSearchChange={groupModalContacts.setSearchInput}
        memberIds={groupModalContacts.memberIds}
        memberCount={groupModalContacts.memberCount}
        membersReady={groupModalContacts.membersReady}
        stackedDialogOpen={modals.confirmDeleteOpen}
        onClose={() => {
          modals.setGroupEditOpen(false);
          modals.setGroupEditRow(null);
        }}
        onSave={actions.handleGroupUpdate}
        onLaunchCampaign={(groupName) => {
          modals.setGroupEditOpen(false);
          modals.setGroupEditRow(null);
          wizard.openCampaignComposer(groupName);
        }}
        onDeleteGroup={actions.handleDeleteGroupFromModal}
      />

      <ContactCreateModal
        open={modals.contactModalOpen}
        onClose={() => modals.setContactModalOpen(false)}
        mode={modals.contactModalMode}
        first={modals.cmFirst}
        last={modals.cmLast}
        phone={modals.cmPhone}
        birthday={modals.cmBirthday}
        notes={modals.cmNotes}
        customFieldDefs={customFieldsState.defs}
        customFields={modals.cmCustomFields}
        groups={modals.cmGroups}
        setGroups={modals.setCmGroups}
        groupOptions={groupOptions}
        onCreateGroupRequest={() => modals.setGroupQuickFromContactOpen(true)}
        consentDefaults={
          modals.contactEditRow
            ? {
                optIn: modals.contactEditRow.optIn,
                stop: modals.contactEditRow.stopSms,
              }
            : null
        }
        onSaveContact={actions.handleContactSave}
        onDeleteContact={
          modals.contactModalMode === "edit"
            ? actions.handleDeleteContactFromModal
            : undefined
        }
        onUnsubscribeContact={
          modals.contactModalMode === "edit"
            ? actions.handleUnsubscribeContact
            : undefined
        }
      />

      <GroupQuickCreateModal
        open={modals.groupQuickFromContactOpen}
        onClose={() => modals.setGroupQuickFromContactOpen(false)}
        onCreated={actions.onGroupQuickCreatedFromContact}
      />

      <CampaignDetailsModal
        open={modals.campaignDetailsOpen}
        campaign={modals.campaignDetailsRow}
        onClose={() => {
          modals.setCampaignDetailsOpen(false);
          modals.setCampaignDetailsRow(null);
        }}
      />

      {user?.id && (
        <ImportContactsModal
          open={modals.importContactsOpen}
          onClose={() => modals.setImportContactsOpen(false)}
          supabase={supabase}
          userId={user.id}
          groupOptions={groupsState.rows.map((g) => g.name)}
          customFieldDefs={customFieldsState.defs}
          onImported={async () => {
            await contactsState.refresh();
            await groupsState.refresh();
          }}
        />
      )}

      <ConfirmDeleteModal
        open={modals.confirmDeleteOpen}
        title={modals.confirmDeleteTitle}
        description={modals.confirmDeleteDesc}
        stacked={
          modals.confirmDeleteOpen &&
          (modals.groupEditOpen || modals.contactModalOpen)
        }
        onConfirm={modals.confirmDeleteAction ?? (async () => {})}
        onCancel={() => modals.setConfirmDeleteOpen(false)}
      />

      <CampaignWizardLeaveConfirmModal
        open={leaveWizardConfirmOpen}
        onStay={() => {
          pendingWizardLeaveActionRef.current = null;
          setLeaveWizardConfirmOpen(false);
        }}
        onLeave={confirmWizardLeave}
      />

      <SoumettreAvisModal
        open={modals.feedbackOpen}
        onClose={() => modals.setFeedbackOpen(false)}
      />
    </>
  );
}
