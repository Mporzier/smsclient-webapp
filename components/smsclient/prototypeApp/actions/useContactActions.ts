"use client";

import {
  deleteClients,
  insertClient,
  updateClient,
  type ContactFormSubmitPayload,
} from "@/lib/supabase/clients";
import { useCallback } from "react";
import type { ActionsContext } from "./types";

export function useContactActions({ data, modals }: ActionsContext) {
  const { user, supabase, contactsState, trashState } = data;
  const {
    contactEditRow,
    contactModalMode,
    cmFirst,
    cmLast,
    cmPhone,
    cmGroups,
    cmBirthday,
    cmNotes,
    setConfirmDeleteOpen,
    setContactModalOpen,
    showToast,
    openConfirmDelete,
  } = modals;

  const handleDeleteContacts = useCallback(
    (ids: string[]) => {
      const n = ids.length;
      openConfirmDelete(
        `Supprimer ${n} contact${n > 1 ? "s" : ""} ?`,
        `${
          n > 1 ? "Les contacts sélectionnés seront" : "Le contact sera"
        } retiré${n > 1 ? "s" : ""} de vos listes. Vous pourrez ${
          n > 1 ? "les" : "le"
        } restaurer dans Paramètres → Éléments supprimés.`,
        async () => {
          const { error } = await deleteClients(supabase, ids);
          if (error) throw error;
          setConfirmDeleteOpen(false);
          contactsState.refresh();
          void trashState.refresh();
          showToast(
            `${n} contact${n > 1 ? "s" : ""} supprimé${n > 1 ? "s" : ""}.`
          );
        }
      );
    },
    [
      openConfirmDelete,
      supabase,
      contactsState,
      trashState,
      showToast,
      setConfirmDeleteOpen,
    ]
  );

  const handleDeleteContactFromModal = useCallback(() => {
    if (!contactEditRow) return;
    setContactModalOpen(false);
    handleDeleteContacts([contactEditRow.id]);
  }, [contactEditRow, handleDeleteContacts, setContactModalOpen]);

  const handleUnsubscribeContact = useCallback(async () => {
    if (!user?.id || !contactEditRow) {
      throw new Error("Vous devez être connecté pour désabonner un contact.");
    }
    const { error } = await updateClient(supabase, user.id, contactEditRow.id, {
      firstName: cmFirst.trim() || contactEditRow.firstName,
      lastName: cmLast.trim() || contactEditRow.lastName,
      phoneDisplay: cmPhone,
      groupLabels: cmGroups,
      birthday: cmBirthday,
      notes: cmNotes,
      optIn: false,
      stop: true,
    });
    if (error) throw error;
    await contactsState.refresh();
    showToast("Contact désabonné.");
  }, [
    user?.id,
    contactEditRow,
    supabase,
    cmFirst,
    cmLast,
    cmPhone,
    cmGroups,
    cmBirthday,
    cmNotes,
    contactsState,
    showToast,
  ]);

  const handleContactSave = useCallback(
    async (payload: ContactFormSubmitPayload) => {
      if (!user?.id) {
        throw new Error(
          "Vous devez être connecté pour enregistrer un contact."
        );
      }
      if (contactModalMode === "edit" && contactEditRow) {
        const { error } = await updateClient(
          supabase,
          user.id,
          contactEditRow.id,
          payload
        );
        if (error) throw error;
      } else {
        const { error } = await insertClient(supabase, user.id, payload);
        if (error) throw error;
      }
      await contactsState.refresh();
      showToast("Contact enregistré");
    },
    [
      user,
      supabase,
      contactModalMode,
      contactEditRow,
      contactsState,
      showToast,
    ]
  );

  return {
    handleDeleteContacts,
    handleDeleteContactFromModal,
    handleUnsubscribeContact,
    handleContactSave,
  };
}
