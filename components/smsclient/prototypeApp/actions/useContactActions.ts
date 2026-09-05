"use client";

import {
  deleteClients,
  deleteClientsMatching,
  insertClient,
  resubscribeClients,
  updateClient,
  type ContactFormSubmitPayload,
} from "@/lib/supabase/clients";
import { useCallback } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { toast } from "@/components/ui/sonner";
import { customFieldTypesFromDefs } from "@/lib/proto/listFilterUi";
import type { ActionsContext } from "./types";

export function useContactActions({ data, modals }: ActionsContext) {
  const {
    user,
    supabase,
    contactsState,
    groupsState,
    trashState,
    customFieldsState,
  } = data;
  const {
    contactEditRow,
    contactModalMode,
    setConfirmDeleteOpen,
    setContactModalOpen,
    openConfirmDelete,
  } = modals;

  const confirmContactDelete = useCallback(
    (n: number, run: () => Promise<number>) => {
      openConfirmDelete(
        `Supprimer ${n} contact${n > 1 ? "s" : ""} ?`,
        `${
          n > 1 ? "Les contacts sélectionnés seront" : "Le contact sera"
        } retiré${n > 1 ? "s" : ""} de vos listes. Vous pourrez ${
          n > 1 ? "les" : "le"
        } restaurer dans Paramètres → Éléments supprimés.`,
        async () => {
          const deleted = await run();
          setConfirmDeleteOpen(false);
          contactsState.refresh();
          groupsState.refresh();
          void trashState.refresh();
          toast(
            `${deleted} contact${deleted > 1 ? "s" : ""} supprimé${
              deleted > 1 ? "s" : ""
            }.`
          );
        }
      );
    },
    [
      openConfirmDelete,
      contactsState,
      groupsState,
      trashState,
      setConfirmDeleteOpen,
    ]
  );

  const handleDeleteContacts = useCallback(
    (
      idsOrResolve: string[] | (() => Promise<string[]>),
      countHint?: number,
    ) => {
      const n =
        countHint ?? (Array.isArray(idsOrResolve) ? idsOrResolve.length : 0);
      confirmContactDelete(n, async () => {
        const ids = Array.isArray(idsOrResolve)
          ? idsOrResolve
          : await idsOrResolve();
        const { error } = await deleteClients(supabase, ids);
        if (error) throw error;
        return ids.length;
      });
    },
    [confirmContactDelete, supabase]
  );

  /** Sélection « tous les contacts » : delete par filtre, sans rapatrier les ids. */
  const handleDeleteContactsMatching = useCallback(
    (search: string, countHint: number, filters?: ColumnFiltersState) => {
      confirmContactDelete(countHint, async () => {
        const { count, error } = await deleteClientsMatching(supabase, {
          search,
          eligibleOnly: true,
          filters,
          customFieldTypes: customFieldTypesFromDefs(customFieldsState.defs),
        });
        if (error) throw error;
        return count;
      });
    },
    [confirmContactDelete, supabase, customFieldsState.defs],
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
      firstName: contactEditRow.firstName,
      lastName: contactEditRow.lastName,
      phoneDisplay: contactEditRow.phone,
      groupLabels: contactEditRow.groups,
      birthday: contactEditRow.birthday,
      notes: contactEditRow.notes,
      customFields: contactEditRow.customFields ?? {},
      optIn: false,
      stop: true,
    });
    if (error) throw error;
    await contactsState.refresh();
    toast("Contact désabonné.");
  }, [user, contactEditRow, supabase, contactsState]);

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
      await groupsState.refresh();
      toast("Contact enregistré");
    },
    [
      user,
      supabase,
      contactModalMode,
      contactEditRow,
      contactsState,
      groupsState,
    ]
  );

  const handleResubscribeContacts = useCallback(
    async (ids: string[]) => {
      if (!user?.id) {
        throw new Error("Vous devez être connecté pour réabonner des contacts.");
      }
      const { error } = await resubscribeClients(supabase, user.id, ids);
      if (error) throw error;
      await contactsState.refresh();
      toast(
        `${ids.length} contact${ids.length > 1 ? "s" : ""} réabonné${
          ids.length > 1 ? "s" : ""
        }.`
      );
    },
    [user, supabase, contactsState]
  );

  return {
    handleDeleteContacts,
    handleDeleteContactsMatching,
    handleDeleteContactFromModal,
    handleUnsubscribeContact,
    handleContactSave,
    handleResubscribeContacts,
  };
}
