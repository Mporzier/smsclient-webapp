"use client";

import {
  addClientsToGroupByName,
  replaceGroupMembers,
} from "@/lib/supabase/clients";
import {
  deleteGroups,
  insertClientGroup,
  updateClientGroup,
} from "@/lib/supabase/groups";
import { useCallback } from "react";
import type { ActionsContext } from "./types";

export function useGroupActions({ data, modals }: ActionsContext) {
  const { user, supabase, contactsState, groupsState, trashState } = data;
  const {
    contactModalOpen,
    groupEditRow,
    setConfirmDeleteOpen,
    setGroupEditOpen,
    setGroupEditRow,
    showToast,
    openConfirmDelete,
    setCmGroups,
  } = modals;

  const preselectGroupOnContactForm = useCallback(
    (groupName: string) => {
      const trimmed = groupName.trim();
      if (!trimmed) return;
      setCmGroups((prev) =>
        prev.includes(trimmed) ? prev : [...prev, trimmed]
      );
    },
    [setCmGroups]
  );

  const handleDeleteGroups = useCallback(
    (ids: string[]) => {
      const n = ids.length;
      openConfirmDelete(
        `Supprimer ${n} groupe${n > 1 ? "s" : ""} ?`,
        `${
          n > 1 ? "Les groupes sélectionnés seront" : "Le groupe sera"
        } retiré${
          n > 1 ? "s" : ""
        } de vos listes. Les contacts ne sont pas supprimés. Restauration possible dans Paramètres → Éléments supprimés.`,
        async () => {
          const { error } = await deleteGroups(supabase, ids);
          if (error) throw error;
          setConfirmDeleteOpen(false);
          groupsState.refresh();
          void trashState.refresh();
          showToast(
            `${n} groupe${n > 1 ? "s" : ""} supprimé${n > 1 ? "s" : ""}.`
          );
        }
      );
    },
    [
      openConfirmDelete,
      supabase,
      groupsState,
      trashState,
      showToast,
      setConfirmDeleteOpen,
    ]
  );

  const handleDeleteGroupFromModal = useCallback(() => {
    if (!groupEditRow) return;
    const id = groupEditRow.id;
    const groupName = groupEditRow.name;
    openConfirmDelete(
      "Supprimer ce groupe ?",
      `Le groupe « ${groupName} » sera retiré de vos listes. Les contacts ne sont pas supprimés. Vous pourrez le restaurer dans Paramètres → Éléments supprimés.`,
      async () => {
        const { error } = await deleteGroups(supabase, [id]);
        if (error) throw error;
        setConfirmDeleteOpen(false);
        setGroupEditOpen(false);
        setGroupEditRow(null);
        groupsState.refresh();
        void trashState.refresh();
        showToast("Groupe supprimé.");
      }
    );
  }, [
    groupEditRow,
    openConfirmDelete,
    supabase,
    groupsState,
    trashState,
    showToast,
    setConfirmDeleteOpen,
    setGroupEditOpen,
    setGroupEditRow,
  ]);

  const onGroupCreatedFromModal = useCallback(
    async (name: string, desc: string, selectedContactIds: string[]) => {
      if (!user?.id) {
        throw new Error("Vous devez être connecté pour créer un groupe.");
      }
      const trimmed = name.trim();
      const { error } = await insertClientGroup(supabase, user.id, name, desc);
      if (error) throw error;
      if (selectedContactIds.length > 0) {
        const assign = await addClientsToGroupByName(
          supabase,
          user.id,
          selectedContactIds,
          trimmed
        );
        if (assign.error) throw assign.error;
      }
      await groupsState.refresh();
      await contactsState.refresh();
      if (contactModalOpen) {
        preselectGroupOnContactForm(trimmed);
      }
      showToast(
        selectedContactIds.length > 0
          ? `Groupe créé · ${selectedContactIds.length} contact${
              selectedContactIds.length > 1 ? "s" : ""
            } rattaché${selectedContactIds.length > 1 ? "s" : ""}`
          : "Groupe créé"
      );
    },
    [
      user,
      supabase,
      groupsState,
      contactsState,
      contactModalOpen,
      preselectGroupOnContactForm,
      showToast,
    ]
  );

  const onGroupQuickCreatedFromContact = useCallback(
    async (name: string, desc: string) => {
      if (!user?.id) {
        throw new Error("Vous devez être connecté pour créer un groupe.");
      }
      const trimmed = name.trim();
      const { error } = await insertClientGroup(
        supabase,
        user.id,
        trimmed,
        desc
      );
      if (error) throw error;
      await groupsState.refresh();
      preselectGroupOnContactForm(trimmed);
      showToast("Groupe créé");
    },
    [user, supabase, groupsState, preselectGroupOnContactForm, showToast]
  );

  const handleGroupUpdate = useCallback(
    async (payload: {
      id: string;
      name: string;
      description: string;
      selectedContactIds: string[];
    }) => {
      if (!user?.id) {
        throw new Error("Vous devez être connecté pour modifier un groupe.");
      }
      const { error } = await updateClientGroup(supabase, user.id, payload.id, {
        name: payload.name,
        description: payload.description,
      });
      if (error) throw error;
      const { error: memErr } = await replaceGroupMembers(
        supabase,
        user.id,
        payload.id,
        payload.selectedContactIds
      );
      if (memErr) throw memErr;
      await groupsState.refresh();
      await contactsState.refresh();
      showToast("Groupe modifié");
    },
    [user, supabase, groupsState, contactsState, showToast]
  );

  return {
    handleDeleteGroups,
    handleDeleteGroupFromModal,
    onGroupCreatedFromModal,
    onGroupQuickCreatedFromContact,
    handleGroupUpdate,
  };
}
