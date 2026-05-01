"use client";

import { cn } from "@/lib/cn";
import { ProtoBtn } from "@/components/smsclient/ui";
import type { GroupRowData } from "@/lib/types/group";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { modalCard, overlayCls } from "./modalChrome";

type GroupEditModalProps = {
  open: boolean;
  group: GroupRowData | null;
  onClose: () => void;
  onSave: (payload: {
    id: string;
    name: string;
    description: string;
  }) => Promise<void>;
  onImportToGroup: () => void;
  onLaunchCampaign: (groupName: string) => void;
};

export function GroupEditModal({
  open,
  group,
  onClose,
  onSave,
  onImportToGroup,
  onLaunchCampaign,
}: GroupEditModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !group) return;
    setName(group.name);
    setDescription(group.description ?? "");
    setError(null);
  }, [open, group]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSave = useCallback(async () => {
    if (!group?.id) return;
    if (!name.trim()) {
      setError("Le nom du groupe est obligatoire.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        id: group.id,
        name,
        description,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }, [group, name, description, onSave, onClose]);

  if (!open || !group) return null;

  return (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal
      aria-label="Modifier le groupe"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn(modalCard, "max-w-[720px]")}>
        <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-[18px] py-4">
          <div>
            <div className="text-lg font-black text-slate-900">
              Modifier le groupe
            </div>
            <div className="text-xs font-bold text-slate-500">
              Mets à jour le nom et la description du segment.
            </div>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-lg font-black shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
            aria-label="Fermer"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="bg-slate-50 p-[18px]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
              <div className="text-[13px] font-black text-slate-900">
                Actions rapides
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <ProtoBtn
                  className="!h-10 !px-3.5 !text-[13px]"
                  onClick={onImportToGroup}
                >
                  Importer dans ce groupe
                </ProtoBtn>
                <ProtoBtn
                  className="!h-10 !px-3.5 !text-[13px]"
                  title="CTA présent, action non implémentée pour l’instant"
                  onClick={() => onLaunchCampaign(name.trim() || group.name)}
                >
                  Lancer une campagne
                </ProtoBtn>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
              <label className="flex justify-between text-[13px] font-black">
                <span>Nom du groupe</span>
                <span className="text-xs text-slate-500">{name.length}/40</span>
              </label>
              <div className="mt-2.5 flex h-11 items-center rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3.5">
                <input
                  className="w-full border-none bg-transparent text-sm font-extrabold outline-none"
                  maxLength={40}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
              <label className="flex justify-between text-[13px] font-black">
                <span>Description</span>
                <span className="text-xs text-slate-500">
                  {description.length}/120
                </span>
              </label>
              <div className="mt-2.5 flex min-h-[120px] items-start rounded-[14px] border border-[#dfe6f2] bg-slate-50 px-3.5 py-2.5">
                <textarea
                  className="min-h-[96px] w-full resize-y border-none bg-transparent text-sm font-semibold leading-relaxed text-slate-900 outline-none placeholder:text-slate-400"
                  maxLength={120}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Ex : Clients fidèles à forte fréquence d'achat."
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="border-t border-rose-200 bg-rose-50 px-[18px] py-2.5 text-sm font-bold text-rose-900">
            {error}
          </div>
        )}

        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-[18px] py-3.5">
          <ProtoBtn disabled={saving} onClick={onClose}>
            Annuler
          </ProtoBtn>
          <ProtoBtn primary disabled={saving} onClick={() => void handleSave()}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </ProtoBtn>
        </div>
      </div>
    </div>
  );
}
