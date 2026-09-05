"use client";

import {
  replaceGroupMembers,
} from "@/lib/supabase/clients";
import {
  createClientGroupWithMembers,
  deleteGroups,
  updateClientGroup,
} from "@/lib/supabase/groups";
import { useCallback } from "react";
import { toast } from "@/components/ui/sonner";
import type { ActionsContext } from "./types";

export function useGroupActions({ data, modals }: ActionsContext) {
  const { user, supabase, contactsState, groupsState, trashState } = data;
  const {
    contactModalOpen,
    groupEditRow,
    setConfirmGroupDeleteOpen,
    setGroupEditOpen,
    setGroupEditRow,
    openConfirmGroupDelete,
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
      openConfirmGroupDelete(n, async () => {
        const { error } = await deleteGroups(supabase, ids);
        if (error) throw error;
        setConfirmGroupDeleteOpen(false);
        groupsState.refresh();
        void trashState.refresh();
        toast(`${n} groupe${n > 1 ? "s" : ""} supprimé${n > 1 ? "s" : ""}.`);
      });
    },
    [
      openConfirmGroupDelete,
      supabase,
      groupsState,
      trashState,
      setConfirmGroupDeleteOpen,
    ]
  );

  const handleDeleteGroupFromModal = useCallback(() => {
    if (!groupEditRow) return;
    const id = groupEditRow.id;
    openConfirmGroupDelete(1, async () => {
      const { error } = await deleteGroups(supabase, [id]);
      if (error) throw error;
      setConfirmGroupDeleteOpen(false);
      setGroupEditOpen(false);
      setGroupEditRow(null);
      groupsState.refresh();
      void trashState.refresh();
      toast("Groupe supprimé.");
    }, true);
  }, [
    groupEditRow,
    openConfirmGroupDelete,
    supabase,
    groupsState,
    trashState,
    setConfirmGroupDeleteOpen,
    setGroupEditOpen,
    setGroupEditRow,
  ]);

  const onGroupCreatedFromModal = useCallback(
    async (name: string, desc: string, selectedContactIds: string[]) => {
      if (!user?.id) {
        throw new Error("Vous devez être connecté pour créer un groupe.");
      }
      const trimmed = name.trim();
      const { error } = await createClientGroupWithMembers(
        supabase,
        trimmed,
        desc,
        selectedContactIds,
      );
      if (error) throw error;
      void groupsState.refresh();
      void contactsState.refresh({ silent: true });
      if (contactModalOpen) {
        preselectGroupOnContactForm(trimmed);
      }
      toast(
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
    ]
  );

  const onGroupQuickCreatedFromContact = useCallback(
    async (name: string, desc: string) => {
      if (!user?.id) {
        throw new Error("Vous devez être connecté pour créer un groupe.");
      }
      const trimmed = name.trim();
      const { error } = await createClientGroupWithMembers(
        supabase,
        trimmed,
        desc,
        [],
      );
      if (error) throw error;
      void groupsState.refresh();
      preselectGroupOnContactForm(trimmed);
      toast("Groupe créé");
    },
    [user, supabase, groupsState, preselectGroupOnContactForm]
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
      void groupsState.refresh();
      void contactsState.refresh({ silent: true });
      toast("Groupe modifié");
    },
    [user, supabase, groupsState, contactsState]
  );

  return {
    handleDeleteGroups,
    handleDeleteGroupFromModal,
    onGroupCreatedFromModal,
    onGroupQuickCreatedFromContact,
    handleGroupUpdate,
  };
}
