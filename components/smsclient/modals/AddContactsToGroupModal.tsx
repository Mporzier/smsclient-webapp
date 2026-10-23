"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { addClientsToGroupByName } from "@/lib/supabase/clients";
import { useI18n } from "@/lib/i18n";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Plus, Users } from "lucide-react";
import { useCallback, useState } from "react";

import { FormDialogShell } from "./FormDialogShell";
import { LIST_FILTER_SELECT_CONTENT_PROPS } from "@/components/smsclient/listViewLayout";

export type AddContactsToGroupModalProps = {
  open: boolean;
  onClose: () => void;
  groupOptions: string[];
  contactCount: number;
  resolveContactIds: () => Promise<string[]>;
  supabase: SupabaseClient;
  userId: string;
  onAdded: () => void | Promise<void>;
  onCreateGroup?: () => void;
};

export function AddContactsToGroupModal({
  open,
  onClose,
  groupOptions,
  contactCount,
  resolveContactIds,
  supabase,
  userId,
  onAdded,
  onCreateGroup,
}: AddContactsToGroupModalProps) {
  const { t } = useI18n();
  const [groupName, setGroupName] = useState("");
  const [saving, setSaving] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setGroupName("");
      setGroupError(null);
      setSaveError(null);
      setSaving(false);
    }
  }

  const handleClose = useCallback(() => {
    if (saving) return;
    onClose();
  }, [onClose, saving]);

  const handleSave = useCallback(async () => {
    const name = groupName.trim();
    if (!name) {
      setGroupError(t("contacts.addToGroup.pickGroup"));
      return;
    }
    setGroupError(null);
    setSaveError(null);
    setSaving(true);
    try {
      const ids = await resolveContactIds();
      if (ids.length === 0) {
        setSaveError(t("contacts.addToGroup.noContacts"));
        return;
      }
      const { error } = await addClientsToGroupByName(
        supabase,
        userId,
        ids,
        name,
      );
      if (error) throw error;
      await onAdded();
      toast(
        ids.length === 1
          ? t("contacts.addToGroup.successOne", { name, n: 1 })
          : t("contacts.addToGroup.successMany", { name, n: ids.length }),
      );
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }, [
    groupName,
    onAdded,
    onClose,
    resolveContactIds,
    supabase,
    t,
    userId,
  ]);

  return (
    <FormDialogShell
      open={open}
      title={t("contacts.addToGroup.title")}
      description={
        contactCount === 1
          ? t("contacts.addToGroup.descriptionOne")
          : t("contacts.addToGroup.descriptionMany", { n: contactCount })
      }
      icon={<Users className="size-5" aria-hidden />}
      onClose={handleClose}
      onSave={() => void handleSave()}
      saving={saving}
      saveLabel={t("contacts.addToGroup.confirm")}
      formDirty={groupName.trim().length > 0}
      footerLeading={
        onCreateGroup ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={saving}
            onClick={onCreateGroup}
          >
            <Plus aria-hidden />
            {t("groups.create")}
          </Button>
        ) : null
      }
    >
      <div className="space-y-1.5">
        <label
          htmlFor="add-contacts-to-group-select"
          className="text-sm font-medium text-foreground"
        >
          {t("import.addToGroup")}
        </label>
        <Select
          value={groupName || undefined}
          onValueChange={(v) => {
            setGroupName(v);
            setGroupError(null);
          }}
          disabled={saving || groupOptions.length === 0}
        >
          <SelectTrigger
            id="add-contacts-to-group-select"
            className="w-full max-w-md cursor-pointer"
          >
            <SelectValue
              placeholder={
                groupOptions.length === 0
                  ? t("contacts.addToGroup.noGroups")
                  : t("contacts.addToGroup.pickGroup")
              }
            />
          </SelectTrigger>
          <SelectContent {...LIST_FILTER_SELECT_CONTENT_PROPS}>
            {groupOptions.map((name) => (
              <SelectItem key={name} value={name} className="cursor-pointer">
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {groupError ? (
          <p className="text-xs font-medium text-destructive">{groupError}</p>
        ) : null}
        {saveError ? (
          <p className="text-xs font-medium text-destructive">{saveError}</p>
        ) : null}
      </div>
    </FormDialogShell>
  );
}
