"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  ConfirmDialogHeader,
  confirmAlertContentCls,
} from "@/components/smsclient/modals/ConfirmInfoCard";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { SEARCH_QUERY_MAX_LENGTH } from "@/lib/forms/fieldLimits";
import {
  innerInputSm,
  innerTextareaSm,
} from "@/components/smsclient/flowFieldStyles";
import { avatarColor, contactInitials } from "@/lib/proto/contactDisplay";
import type { GroupRowData } from "@/lib/types/group";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CheckCheck,
  Eraser,
  Phone,
  Search,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import {
  dialogContentZCls,
  dialogOverlayCls,
  dialogOverlayStackedCls,
  formDialogContentCls,
  preventDialogOpenAutoFocus,
} from "./modalChrome";
import { FormDialogHeader } from "./FormDialogHeader";
import {
  groupFormSnapshotsEqual,
  hasStackedOpenDialog,
  sortedStringArraysEqual,
  type GroupFormSnapshot,
} from "./modalFormGuard";
import { CellTruncate } from "@/components/smsclient/ui";
import { ContactGroupsCell } from "@/components/smsclient/ContactGroupsCell";
import { SelectAllExpandBanner } from "@/components/smsclient/SelectAllExpandBanner";
import { LoadingLabel } from "@/components/ui/loading-label";
import { useGmailSelectAll } from "@/hooks/useGmailSelectAll";

export type GroupModalContactRow = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  groups: string[];
};

type GroupModalSharedProps = {
  open: boolean;
  onClose: () => void;
  contacts?: GroupModalContactRow[];
  contactsLoading?: boolean;
  contactsLoadingMore?: boolean;
  contactsHasMore?: boolean;
  onContactsLoadMore?: () => void;
  contactsTotalCount?: number | null;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  /** IDs membres (edit) — sélection initiale, indépendant du lazyload. */
  memberIds?: string[];
  /** Nombre de contacts déjà dans le groupe (edit). */
  memberCount?: number;
  membersReady?: boolean;
  /** Autre dialogue empilé (ex. confirmation de suppression). */
  stackedDialogOpen?: boolean;
  onCountSelectableMatches?: (
    search: string
  ) => Promise<{ count: number; error: Error | null }>;
  onFetchSelectableMatchIds?: (
    search: string
  ) => Promise<{ data: string[]; error: Error | null }>;
};

export type GroupModalCreateProps = GroupModalSharedProps & {
  mode: "create";
  onCreated?: (
    name: string,
    description: string,
    selectedContactIds: string[]
  ) => void | Promise<void>;
};

export type GroupModalEditProps = GroupModalSharedProps & {
  mode: "edit";
  group: GroupRowData | null;
  onSave: (payload: {
    id: string;
    name: string;
    description: string;
    selectedContactIds: string[];
  }) => Promise<void>;
  onLaunchCampaign: (groupName: string) => void;
  onDeleteGroup?: () => void;
};

export type GroupModalProps = GroupModalCreateProps | GroupModalEditProps;

const fieldShell =
  "rounded-xl border border-border bg-card p-2.5 shadow-[0_8px_18px_rgba(15,23,42,0.06)]";

const inpText =
  "w-full border-none bg-transparent text-[13px] font-normal text-foreground outline-none placeholder:text-muted-foreground/40 placeholder:font-normal";

const fieldLabelCls = "text-xs font-medium text-foreground";
const fieldMetaCls = "text-[11px] font-normal text-muted-foreground";
const sectionTitleCls = "text-s font-extrabold text-foreground";
const hintTextCls =
  "text-[11px] font-normal leading-snug text-muted-foreground";
const labelIconBadgeCls =
  "grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border bg-gradient-to-br from-violet-50 to-indigo-50 text-ring";
const contactsPanelShell =
  "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card p-2.5 shadow-[0_8px_18px_rgba(15,23,42,0.06)]";
const tableHeadCls =
  "h-9 border-b border-border px-2 py-0 text-[11px] font-medium text-muted-foreground align-middle";
const tableCellCls =
  "h-[52px] max-h-[52px] overflow-hidden px-2 py-0 text-[13px] font-normal text-foreground align-middle";
const compactBtnCls = "!h-8 !min-h-8 !gap-1.5 !px-2.5 !text-xs !font-medium";
const listCheckboxCls =
  "size-3.5 shrink-0 overflow-hidden cursor-pointer [&_svg]:size-2.5";

function buildSaveContactsConfirmCopy(
  selectedIds: string[],
  baselineIds: string[],
  groupLabel: string
): { title: string; description: string; confirmLabel: string } {
  const baselineSet = new Set(baselineIds);
  const selectedSet = new Set(selectedIds);
  const addedCount = selectedIds.filter((id) => !baselineSet.has(id)).length;
  const removedCount = baselineIds.filter((id) => !selectedSet.has(id)).length;

  const parts: string[] = [];
  if (addedCount > 0) {
    parts.push(`${addedCount} ajout${addedCount > 1 ? "s" : ""}`);
  }
  if (removedCount > 0) {
    parts.push(`${removedCount} retrait${removedCount > 1 ? "s" : ""}`);
  }

  const description = `Pour le groupe « ${groupLabel} » : ${parts.join(", ")}.`;

  return {
    title: "Confirmer la mise à jour des contacts ?",
    description,
    confirmLabel: "Enregistrer",
  };
}

type GroupContactSelectionConfirmProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function GroupContactSelectionConfirm({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: GroupContactSelectionConfirmProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent
        overlayClassName={dialogOverlayStackedCls}
        className={confirmAlertContentCls(true)}
        onOutsideDismiss={onCancel}
      >
        <ConfirmDialogHeader
          title={title}
          media={<UserRound strokeWidth={2} aria-hidden />}
          mediaClassName={labelIconBadgeCls}
          description={description}
        />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const CONTACT_ROW_H = 52;
const CONTACT_ROW_OVERSCAN = 10;

type GroupModalContactsPanelProps = {
  contacts: GroupModalContactRow[];
  contactsLoading: boolean;
  contactsLoadingMore: boolean;
  contactsHasMore: boolean;
  onContactsLoadMore?: () => void;
  contactsTotalCount: number | null;
  memberIds: string[];
  memberCount: number;
  contactQuery: string;
  onContactQueryChange: (value: string) => void;
  filteredContacts: GroupModalContactRow[];
  selectedIds: string[];
  toggleContact: (id: string) => void;
  selectAllFiltered: () => void;
  clearSelection: () => void;
  allFilteredSelected: boolean;
  someFilteredSelected: boolean;
  toggleSelectAllFiltered: () => void;
  groupLabel: string;
  listAriaLabel: string;
  showExpandBanner?: boolean;
  matchTotal?: number | null;
  countingSelection?: boolean;
  expandingSelection?: boolean;
  expandError?: string | null;
  onExpandSelection?: () => void;
  displaySelectedCount?: number;
};

function GroupModalContactsPanel({
  contacts,
  contactsLoading,
  contactsLoadingMore,
  contactsHasMore,
  onContactsLoadMore,
  contactsTotalCount,
  memberIds,
  memberCount,
  contactQuery,
  onContactQueryChange,
  filteredContacts,
  selectedIds,
  toggleContact,
  selectAllFiltered,
  clearSelection,
  allFilteredSelected,
  someFilteredSelected,
  toggleSelectAllFiltered,
  listAriaLabel,
  showExpandBanner = false,
  matchTotal = null,
  countingSelection = false,
  expandingSelection = false,
  expandError = null,
  onExpandSelection,
  displaySelectedCount,
}: GroupModalContactsPanelProps) {
  const clearDisabled =
    (displaySelectedCount ?? selectedIds.length) === 0;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(320);
  const [scrollQuery, setScrollQuery] = useState(contactQuery);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const loadMoreRef = useRef(onContactsLoadMore);

  useEffect(() => {
    loadMoreRef.current = onContactsLoadMore;
  });

  if (contactQuery !== scrollQuery) {
    setScrollQuery(contactQuery);
    setScrollTop(0);
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const sync = () => setViewportH(el.clientHeight || 320);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [contactsLoading, contacts.length, filteredContacts.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = 0;
  }, [contactQuery]);

  const total = filteredContacts.length;
  const start = Math.max(
    0,
    Math.floor(scrollTop / CONTACT_ROW_H) - CONTACT_ROW_OVERSCAN
  );
  const visible =
    Math.ceil(viewportH / CONTACT_ROW_H) + CONTACT_ROW_OVERSCAN * 2;
  const end = Math.min(total, start + visible);
  const windowed = filteredContacts.slice(start, end);
  const padTop = start * CONTACT_ROW_H;
  const padBottom = Math.max(0, (total - end) * CONTACT_ROW_H);

  useEffect(() => {
    if (!contactsHasMore || contactsLoading || contactsLoadingMore) return;
    if (end >= total - CONTACT_ROW_OVERSCAN) {
      loadMoreRef.current?.();
    }
  }, [end, total, contactsHasMore, contactsLoading, contactsLoadingMore]);

  return (
    <div className={contactsPanelShell}>
      <div className="flex shrink-0 items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex min-h-8 items-center gap-1.5">
            <span className={labelIconBadgeCls} aria-hidden>
              <UserRound className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <h3 className={cn("m-0", sectionTitleCls)}>Contacts du groupe</h3>
          </div>
          <div
            className={cn(
              innerInputSm,
              "h-9 min-w-0 gap-2 px-2.5 shadow-[0_4px_10px_rgba(15,23,42,0.04)]"
            )}
          >
            <Search
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <input
              className={cn(inpText, "min-w-0 flex-1")}
              placeholder="Filtrer par nom, téléphone, groupe…"
              value={contactQuery}
              maxLength={SEARCH_QUERY_MAX_LENGTH}
              onChange={(e) => onContactQueryChange(e.target.value)}
              aria-label="Filtrer les contacts"
            />
          </div>
        </div>
        <div className="flex w-max shrink-0 flex-col gap-2">
          {showExpandBanner ? (
            <SelectAllExpandBanner
              className="w-0 min-w-full flex-none"
              matchTotal={matchTotal}
              hasSearch={contactQuery.trim().length > 0}
              entityLabel="contacts"
              counting={countingSelection}
              expanding={expandingSelection}
              error={expandError}
              onExpand={() => onExpandSelection?.()}
            />
          ) : null}
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className={compactBtnCls}
              onClick={selectAllFiltered}
              disabled={contactsLoading || filteredContacts.length === 0}
            >
              <CheckCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Tout sélectionner
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className={compactBtnCls}
              onClick={clearSelection}
              disabled={clearDisabled}
            >
              <Eraser className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Effacer la sélection
            </Button>
          </div>
        </div>
      </div>

      {contactsLoading ? (
        <div
          className={cn(
            "flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 px-3 py-8 text-center",
            hintTextCls
          )}
        >
          <LoadingLabel>Chargement des contacts…</LoadingLabel>
        </div>
      ) : contacts.length === 0 ? (
        <div
          className={cn(
            "flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 px-3 py-8 text-center",
            hintTextCls
          )}
        >
          Aucun contact enregistré. Ajoutez des contacts depuis l’onglet{" "}
          <span className="font-medium text-foreground">Contacts</span>, puis
          revenez ici.
        </div>
      ) : (
        <div
          ref={scrollerRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-lg border border-border [scrollbar-gutter:stable]"
          role="listbox"
          aria-label={listAriaLabel}
          aria-multiselectable
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        >
          <table className="w-full table-fixed border-separate border-spacing-0 text-left">
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ width: 44 }} />
              <col />
              <col style={{ width: "28%" }} />
              <col style={{ width: "26%" }} />
            </colgroup>
            <thead className="sticky top-0 z-[1] bg-muted">
              <tr>
                <th className={cn("w-9", tableHeadCls)} scope="col">
                  <Checkbox
                    className={cn(
                      listCheckboxCls,
                      "disabled:cursor-not-allowed"
                    )}
                    checked={
                      allFilteredSelected
                        ? true
                        : someFilteredSelected
                        ? "indeterminate"
                        : false
                    }
                    onCheckedChange={() => toggleSelectAllFiltered()}
                    disabled={contactsLoading || filteredContacts.length === 0}
                    aria-label="Tout sélectionner les contacts affichés"
                  />
                </th>
                <th
                  className={cn("w-11", tableHeadCls)}
                  scope="col"
                  aria-label="Initiales"
                />
                <th className={tableHeadCls}>Contact</th>
                <th className={tableHeadCls}>Téléphone</th>
                <th
                  className={cn("hidden sm:table-cell", tableHeadCls)}
                  scope="col"
                >
                  Groupes
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className={cn(
                      "px-3 py-8 text-center",
                      hintTextCls,
                      "text-muted-foreground"
                    )}
                  >
                    Aucun résultat pour cette recherche.
                  </td>
                </tr>
              ) : (
                <>
                  {padTop > 0 && (
                    <tr aria-hidden>
                      <td colSpan={5} style={{ height: padTop, padding: 0 }} />
                    </tr>
                  )}
                  {windowed.map((c) => {
                    const checked = selectedSet.has(c.id);
                    const initials = contactInitials(c);
                    const av = avatarColor(c.id);
                    return (
                      <tr
                        key={c.id}
                        className="cursor-pointer border-b border-border/50 bg-card transition-colors hover:bg-muted/50"
                        style={{ height: CONTACT_ROW_H }}
                        onClick={() => toggleContact(c.id)}
                        role="option"
                        aria-selected={checked}
                      >
                        <td className={tableCellCls}>
                          <Checkbox
                            className={listCheckboxCls}
                            checked={checked}
                            onCheckedChange={() => toggleContact(c.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Sélectionner ${c.name}`}
                          />
                        </td>
                        <td className={tableCellCls}>
                          <div
                            className={cn(
                              "grid h-8 w-8 place-items-center rounded-full text-xs font-semibold",
                              av.bg,
                              av.text
                            )}
                            aria-hidden
                          >
                            {initials}
                          </div>
                        </td>
                        <td className={cn(tableCellCls, "min-w-0 font-medium")}>
                          <CellTruncate as="div">
                            {c.name.trim() || "—"}
                          </CellTruncate>
                        </td>
                        <td className={cn(tableCellCls, "min-w-0")}>
                          <span className="flex min-w-0 max-w-full items-center gap-1.5 text-muted-foreground">
                            <Phone
                              className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                              aria-hidden
                            />
                            <CellTruncate as="span" className="min-w-0">
                              {c.phone}
                            </CellTruncate>
                          </span>
                        </td>
                        <td
                          className={cn(
                            "hidden sm:table-cell",
                            tableCellCls,
                            "min-w-0"
                          )}
                        >
                          <ContactGroupsCell
                            groups={c.groups}
                            emptyLabel="Non classé"
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {padBottom > 0 && (
                    <tr aria-hidden>
                      <td
                        colSpan={5}
                        style={{ height: padBottom, padding: 0 }}
                      />
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!contactsLoading && (contacts.length > 0 || memberCount > 0) && (
        <GroupModalContactsFooter
          memberCount={memberCount}
          memberIds={memberIds}
          selectedIds={selectedIds}
          contactsTotalCount={contactsTotalCount}
          contactsLoadingMore={contactsLoadingMore}
          displaySelectedCount={displaySelectedCount ?? selectedIds.length}
        />
      )}
    </div>
  );
}

function GroupModalContactsFooter({
  memberCount,
  memberIds,
  selectedIds,
  contactsTotalCount,
  contactsLoadingMore,
  displaySelectedCount,
}: {
  memberCount: number;
  memberIds: string[];
  selectedIds: string[];
  contactsTotalCount: number | null;
  contactsLoadingMore: boolean;
  displaySelectedCount: number;
}) {
  const memberIdSet = useMemo(() => new Set(memberIds), [memberIds]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedNewCount = useMemo(() => {
    const fromIds = selectedIds.filter((id) => !memberIdSet.has(id)).length;
    if (displaySelectedCount > selectedIds.length) {
      return Math.max(fromIds, displaySelectedCount - memberCount);
    }
    return fromIds;
  }, [selectedIds, memberIdSet, displaySelectedCount, memberCount]);
  const deselectedCount = useMemo(
    () => memberIds.filter((id) => !selectedSet.has(id)).length,
    [memberIds, selectedSet]
  );

  const parts: { key: string; node: ReactNode }[] = [];
  if (memberCount > 0) {
    parts.push({
      key: "members",
      node: (
        <>
          <span className="font-medium text-foreground">{memberCount}</span>{" "}
          contact{memberCount > 1 ? "s" : ""} déjà dans le groupe
        </>
      ),
    });
  }
  if (selectedNewCount > 0) {
    parts.push({
      key: "selected",
      node: (
        <>
          <span className="font-medium text-foreground">
            {selectedNewCount}
          </span>{" "}
          sélectionné{selectedNewCount > 1 ? "s" : ""}
        </>
      ),
    });
  }
  if (deselectedCount > 0) {
    parts.push({
      key: "deselected",
      node: (
        <span className="font-medium text-destructive">
          {deselectedCount} contact{deselectedCount > 1 ? "s" : ""}{" "}
          désélectionné{deselectedCount > 1 ? "s" : ""}
        </span>
      ),
    });
  } else if (memberCount === 0 && displaySelectedCount === 0) {
    parts.push({ key: "none", node: <>Aucun contact sélectionné</> });
  }
  if (typeof contactsTotalCount === "number") {
    parts.push({
      key: "total",
      node: (
        <>
          <span className="font-medium text-foreground">
            {contactsTotalCount}
          </span>{" "}
          contact{contactsTotalCount > 1 ? "s" : ""} total
        </>
      ),
    });
  }
  if (contactsLoadingMore) {
    parts.push({
      key: "more",
      node: (
        <LoadingLabel className="gap-1.5" spinnerClassName="size-3.5">
          Chargement…
        </LoadingLabel>
      ),
    });
  }

  if (parts.length === 0) return null;

  return (
    <p
      className={cn(
        "m-0 min-h-[1.25rem] shrink-0 overflow-x-auto whitespace-nowrap",
        hintTextCls
      )}
    >
      {parts.map((part, i) => (
        <span key={part.key}>
          {i > 0 ? <span className="text-muted-foreground"> · </span> : null}
          {part.node}
        </span>
      ))}
    </p>
  );
}

export function GroupModal(props: GroupModalProps) {
  const isCreate = props.mode === "create";
  const group = isCreate ? null : props.group;
  const contacts = useMemo(() => props.contacts ?? [], [props.contacts]);
  const contactsLoading = props.contactsLoading ?? false;
  const contactsLoadingMore = props.contactsLoadingMore ?? false;
  const contactsHasMore = props.contactsHasMore ?? false;
  const onContactsLoadMore = props.onContactsLoadMore;
  const contactsTotalCount = props.contactsTotalCount ?? null;
  const memberIds = props.memberIds ?? [];
  const memberCount = props.memberCount ?? memberIds.length;
  const membersReady = props.membersReady ?? true;
  const stackedDialogOpen = props.stackedDialogOpen ?? false;
  const onCountSelectableMatches = props.onCountSelectableMatches;
  const onFetchSelectableMatchIds = props.onFetchSelectableMatchIds;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [localContactQuery, setLocalContactQuery] = useState("");
  const contactQuery = props.searchQuery ?? localContactQuery;
  const onContactQueryChange = props.onSearchChange ?? setLocalContactQuery;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [formBaseline, setFormBaseline] = useState<GroupFormSnapshot | null>(
    null
  );
  const [wasGroupOpen, setWasGroupOpen] = useState(props.open);
  const [syncedEditGroupId, setSyncedEditGroupId] = useState<string | null>(
    null
  );
  const [selectionSyncKey, setSelectionSyncKey] = useState<string | null>(null);

  // Search serveur : la liste reçue est déjà filtrée.
  const filteredContacts = contacts;

  const loadedIds = useMemo(
    () => filteredContacts.map((c) => c.id),
    [filteredContacts]
  );

  const countMatch = useCallback(async () => {
    if (!onCountSelectableMatches) {
      return { count: loadedIds.length, error: null };
    }
    return onCountSelectableMatches(contactQuery);
  }, [onCountSelectableMatches, contactQuery, loadedIds.length]);

  const fetchAllIds = useCallback(async () => {
    if (!onFetchSelectableMatchIds) {
      return { data: loadedIds, error: null };
    }
    return onFetchSelectableMatchIds(contactQuery);
  }, [onFetchSelectableMatchIds, contactQuery, loadedIds]);

  const {
    selectLoaded,
    deselectLoaded,
    clearSelection,
    showExpandBanner,
    matchTotal,
    displaySelectedCount,
    counting,
    expanding,
    expandError,
    expandToMatchAll,
    ensureSelectionReady,
  } = useGmailSelectAll({
    search: contactQuery,
    loadedIds,
    selectedIds,
    setSelectedIds,
    countMatch,
    fetchAllIds,
    selectLoadedMode: "merge",
    expandMode: "merge",
    // Membres hors filtre doivent survivre au search (edit groupe).
    clearOnSearchChange: false,
    expandCandidate:
      contactsHasMore ||
      (typeof contactsTotalCount === "number" &&
        contactsTotalCount > loadedIds.length),
    listMatchTotal: contactsTotalCount,
  });

  const toggleContact = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const selectAllFiltered = selectLoaded;

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const allFilteredSelected = useMemo(
    () =>
      filteredContacts.length > 0 &&
      filteredContacts.every((c) => selectedSet.has(c.id)),
    [filteredContacts, selectedSet]
  );

  const someFilteredSelected = useMemo(
    () => filteredContacts.some((c) => selectedSet.has(c.id)),
    [filteredContacts, selectedSet]
  );

  const toggleSelectAllFiltered = useCallback(() => {
    if (filteredContacts.length === 0) return;
    if (allFilteredSelected) deselectLoaded();
    else selectLoaded();
  }, [
    filteredContacts.length,
    allFilteredSelected,
    deselectLoaded,
    selectLoaded,
  ]);

  const contactsSelectionChanged = useMemo(() => {
    if (isCreate || formBaseline === null) return false;
    return !sortedStringArraysEqual(selectedIds, formBaseline.selectedIds);
  }, [isCreate, formBaseline, selectedIds]);

  if (props.open !== wasGroupOpen) {
    setWasGroupOpen(props.open);
    if (!props.open) {
      setName("");
      setDescription("");
      setLocalContactQuery("");
      setSelectedIds([]);
      setSaving(false);
      setError(null);
      setNameError(null);
      setSaveConfirmOpen(false);
      setFormBaseline(null);
      setSyncedEditGroupId(null);
      setSelectionSyncKey(null);
    }
  }

  if (props.open && !isCreate && group && syncedEditGroupId !== group.id) {
    setSyncedEditGroupId(group.id);
    setName(group.name);
    setDescription(group.description ?? "");
    setError(null);
    setNameError(null);
    setSelectionSyncKey(null);
  }

  if (isCreate || !props.open || !group) {
    if ((!props.open || isCreate) && selectionSyncKey !== null) {
      setSelectionSyncKey(null);
    }
  } else if (!membersReady) {
    // Membres pas encore chargés — invalider le sync pour rejouer avec memberIds.
    if (selectionSyncKey !== null) {
      setSelectionSyncKey(null);
    }
  } else {
    const key = `${group.id}:${group.name}`;
    if (selectionSyncKey !== key) {
      setSelectionSyncKey(key);
      setSelectedIds([...memberIds]);
      setFormBaseline({
        name: group.name,
        description: group.description ?? "",
        selectedIds: [...memberIds],
      });
    }
  }

  const onClose = props.onClose;
  const onCreated = isCreate ? props.onCreated : undefined;
  const onSave = !isCreate ? props.onSave : undefined;
  const onLaunchCampaign = !isCreate ? props.onLaunchCampaign : undefined;
  const onDeleteGroup = !isCreate ? props.onDeleteGroup : undefined;

  const handleCreate = useCallback(async () => {
    if (!isCreate) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Indiquez un nom de groupe.");
      return;
    }
    setNameError(null);
    setError(null);
    setSaving(true);
    try {
      const ids = await ensureSelectionReady();
      await onCreated?.(trimmed, description.trim(), ids);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Enregistrement impossible.";
      if (msg.includes("existe déjà")) {
        setNameError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  }, [isCreate, name, description, ensureSelectionReady, onCreated, onClose]);

  const handleSave = useCallback(async () => {
    if (isCreate || !group?.id || !onSave) return;
    if (!name.trim()) {
      setNameError("Le nom du groupe est obligatoire.");
      return;
    }
    setNameError(null);
    setSaving(true);
    setError(null);
    try {
      const ids = await ensureSelectionReady();
      await onSave({
        id: group.id,
        name,
        description,
        selectedContactIds: ids,
      });
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Enregistrement impossible.";
      if (msg.includes("existe déjà")) {
        setNameError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  }, [
    isCreate,
    group,
    name,
    description,
    ensureSelectionReady,
    onSave,
    onClose,
  ]);

  const requestSave = useCallback(() => {
    if (isCreate || !group?.id || !onSave) return;
    if (!name.trim()) {
      setNameError("Le nom du groupe est obligatoire.");
      return;
    }
    setNameError(null);
    setError(null);
    if (contactsSelectionChanged) {
      setSaveConfirmOpen(true);
      return;
    }
    void handleSave();
  }, [isCreate, group, onSave, name, contactsSelectionChanged, handleSave]);

  const handleLaunchCampaign = useCallback(() => {
    if (isCreate || !group || !onLaunchCampaign) return;
    onLaunchCampaign(name.trim() || group.name);
  }, [isCreate, group, name, onLaunchCampaign]);

  const dialogOpen = props.open && (isCreate || !!group);

  const groupLabel = name.trim() || (group?.name ?? "ce groupe");
  const dialogLabel = isCreate ? "Créer un groupe" : "Modifier le groupe";
  const listAriaLabel = isCreate
    ? "Contacts à rattacher au groupe"
    : "Contacts du groupe";

  const saveConfirmCopy =
    saveConfirmOpen && formBaseline
      ? buildSaveContactsConfirmCopy(
          selectedIds,
          formBaseline.selectedIds,
          groupLabel
        )
      : null;

  // Création : pas de baseline, tout contenu saisi compte. Édition : baseline
  // posée une fois les membres chargés.
  const formDirty = isCreate
    ? Boolean(name.trim() || description.trim() || selectedIds.length > 0)
    : formBaseline !== null &&
      !groupFormSnapshotsEqual({ name, description, selectedIds }, formBaseline);

  const canDismissMain =
    !saving && !stackedDialogOpen && !saveConfirmOpen && !formDirty;

  return (
    <>
      <Dialog
        open={dialogOpen}
        onOpenChange={(next) => {
          if (!next) {
            if (saving || stackedDialogOpen || saveConfirmOpen || hasStackedOpenDialog()) return;
            onClose();
          }
        }}
      >
        <DialogContent
          showCloseButton={!saving}
          overlayClassName={dialogOverlayCls}
          className={cn(
            formDialogContentCls,
            "h-[min(86dvh,760px)] max-h-[min(86dvh,760px)] sm:max-w-[720px]",
            dialogContentZCls
          )}
          onOpenAutoFocus={preventDialogOpenAutoFocus}
          onPointerDownOutside={(e) => {
            // Confirm / delete empilés : laisser l’event pour les fermer.
            if (
              stackedDialogOpen ||
              saveConfirmOpen ||
              hasStackedOpenDialog()
            ) {
              return;
            }
            if (!canDismissMain) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (
              stackedDialogOpen ||
              saveConfirmOpen ||
              hasStackedOpenDialog()
            ) {
              return;
            }
            if (!canDismissMain) e.preventDefault();
          }}
        >
          <FormDialogHeader
            icon={<Users strokeWidth={2} />}
            title={dialogLabel}
            description={
              !isCreate
                ? "Créez un groupe et ajoutez les contacts à associer."
                : undefined
            }
            descriptionClassName={hintTextCls}
          />

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-muted/50 px-4 py-3">
            <div className="grid min-w-0 shrink-0 grid-cols-1 gap-2 sm:grid-cols-2">
              <div className={fieldShell}>
                <label
                  className="flex justify-between gap-2"
                  htmlFor="group-modal-name"
                >
                  <span className={fieldLabelCls}>
                    Nom du groupe <span className="text-destructive">*</span>
                  </span>
                  <span className={fieldMetaCls}>{name.length}/40</span>
                </label>
                <div className={cn(innerInputSm, "mt-1.5 h-9")}>
                  <input
                    id="group-modal-name"
                    className={inpText}
                    maxLength={40}
                    value={name}
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={
                      nameError ? "group-modal-name-err" : undefined
                    }
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameError(null);
                      setError(null);
                    }}
                    placeholder="Ex. Clients VIP"
                  />
                </div>
                {nameError ? (
                  <p
                    id="group-modal-name-err"
                    className={cn(
                      "m-0 mt-1.5",
                      hintTextCls,
                      "text-destructive"
                    )}
                  >
                    {nameError}
                  </p>
                ) : null}
              </div>
              <div className={fieldShell}>
                <label className="flex justify-between gap-2">
                  <span className={fieldLabelCls}>Description</span>
                  <span className={fieldMetaCls}>{description.length}/120</span>
                </label>
                <div className={cn(innerTextareaSm, "mt-1.5")}>
                  <textarea
                    className="min-h-[52px] w-full resize-none border-none bg-transparent text-[13px] font-normal leading-snug text-foreground outline-none placeholder:text-muted-foreground/40 placeholder:font-normal"
                    maxLength={120}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Ex. Clients VIP, relance juin"
                  />
                </div>
              </div>
            </div>

            <GroupModalContactsPanel
              contacts={contacts}
              contactsLoading={contactsLoading}
              contactsLoadingMore={contactsLoadingMore}
              contactsHasMore={contactsHasMore}
              onContactsLoadMore={onContactsLoadMore}
              contactsTotalCount={contactsTotalCount}
              memberIds={memberIds}
              memberCount={memberCount}
              contactQuery={contactQuery}
              onContactQueryChange={onContactQueryChange}
              filteredContacts={filteredContacts}
              selectedIds={selectedIds}
              toggleContact={toggleContact}
              selectAllFiltered={selectAllFiltered}
              clearSelection={clearSelection}
              allFilteredSelected={allFilteredSelected}
              someFilteredSelected={someFilteredSelected}
              toggleSelectAllFiltered={toggleSelectAllFiltered}
              groupLabel={groupLabel}
              listAriaLabel={listAriaLabel}
              showExpandBanner={showExpandBanner}
              matchTotal={matchTotal}
              countingSelection={counting}
              expandingSelection={expanding}
              expandError={expandError}
              onExpandSelection={() => void expandToMatchAll()}
              displaySelectedCount={displaySelectedCount}
            />
          </div>

          {error ? (
            <div className="shrink-0 border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <DialogFooter className="mx-0 mb-0 shrink-0 flex-row flex-wrap items-center justify-between gap-2 rounded-b-xl p-2.5 px-4 sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {!isCreate && onDeleteGroup && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={onDeleteGroup}
                  className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Supprimer
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={onClose}
                className="cursor-pointer"
              >
                Annuler
              </Button>
              {!isCreate && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  title="CTA présent, action non implémentée pour l'instant"
                  onClick={handleLaunchCampaign}
                  className="cursor-pointer"
                >
                  Lancer une campagne
                </Button>
              )}
              <Button
                type="button"
                variant="default"
                disabled={saving}
                onClick={() => void (isCreate ? handleCreate() : requestSave())}
                className="cursor-pointer"
              >
                {saving
                  ? "Enregistrement…"
                  : isCreate
                    ? "Créer le groupe"
                    : "Enregistrer"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GroupContactSelectionConfirm
        open={saveConfirmCopy !== null}
        title={saveConfirmCopy?.title ?? ""}
        description={saveConfirmCopy?.description ?? ""}
        confirmLabel={saveConfirmCopy?.confirmLabel ?? "Enregistrer"}
        onConfirm={() => {
          setSaveConfirmOpen(false);
          void handleSave();
        }}
        onCancel={() => setSaveConfirmOpen(false)}
      />
    </>
  );
}

/** @deprecated Utiliser `GroupModal` avec `mode="create"`. */
export function GroupCreateModal(props: Omit<GroupModalCreateProps, "mode">) {
  return <GroupModal mode="create" {...props} />;
}

/** @deprecated Utiliser `GroupModal` avec `mode="edit"`. */
export function GroupEditModal(props: Omit<GroupModalEditProps, "mode">) {
  return <GroupModal mode="edit" {...props} />;
}

/** @deprecated Renommé en `GroupModalContactRow`. */
export type GroupCreateModalContactRow = GroupModalContactRow;
