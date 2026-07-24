"use client";

import { CellTruncate } from "@/components/smsclient/ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/smsclient/DataTable";
import { CONTACT_COL } from "@/components/smsclient/listColumnSizes";
import {
  UnsubscribedContactsModal,
  type UnsubscribedContactRow,
} from "@/components/smsclient/modals/UnsubscribedContactsModal";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/cn";
import { useI18n, type MessageKey } from "@/lib/i18n";
import {
  avatarColor,
  contactInitials,
  groupColor,
  groupTagBase,
} from "@/lib/proto/contactDisplay";
import type { ContactRowData } from "@/lib/types/contact";
import { isCampaignEligibleContact } from "@/lib/types/contact";
import { compareIsoTimestampsStable } from "@/lib/proto/compareIso";
import { sortContactRows } from "@/lib/proto/sortContactRows";
import { formatCustomFieldDisplay } from "@/lib/customFields/validate";
import type { CustomFieldDef } from "@/lib/types/customFields";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Download,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";

const tagBase = groupTagBase;
const GROUPS_GAP_PX = 4;

function ContactGroupsCell({ groups }: { groups: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const ellipsisRef = useRef<HTMLSpanElement>(null);
  const tipAnchorRef = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(groups.length);
  const [tipOpen, setTipOpen] = useState(false);
  const [tipPos, setTipPos] = useState({ top: 0, left: 0 });

  const recompute = useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    const ellipsis = ellipsisRef.current;
    if (!container || !measure || !ellipsis) return;

    const avail = container.clientWidth;
    if (avail <= 0) return;

    const pills = Array.from(
      measure.querySelectorAll<HTMLElement>("[data-group-pill]")
    );
    const ellipsisW = ellipsis.offsetWidth;
    let used = 0;
    let count = 0;

    for (let i = 0; i < pills.length; i++) {
      const w = pills[i]!.offsetWidth;
      const nextUsed = used + (count > 0 ? GROUPS_GAP_PX : 0) + w;
      const hasMore = i < pills.length - 1;
      if (hasMore) {
        if (nextUsed + GROUPS_GAP_PX + ellipsisW <= avail) {
          used = nextUsed;
          count = i + 1;
        } else {
          break;
        }
      } else if (nextUsed <= avail) {
        count = i + 1;
      }
    }

    if (count === 0 && groups.length > 0) {
      setVisibleCount(0);
      return;
    }
    setVisibleCount(count);
  }, [groups.length]);

  useLayoutEffect(() => {
    recompute();
  }, [groups, recompute]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => recompute());
    ro.observe(el);
    return () => ro.disconnect();
  }, [recompute]);

  const updateTipPos = useCallback(() => {
    const el = tipAnchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTipPos({
      top: rect.bottom + 6,
      left: Math.min(Math.max(8, rect.left), window.innerWidth - 16),
    });
  }, []);

  const showTip = useCallback(() => {
    updateTipPos();
    setTipOpen(true);
  }, [updateTipPos]);

  const hideTip = useCallback(() => setTipOpen(false), []);

  useEffect(() => {
    if (!tipOpen) return;
    const onScrollOrResize = () => updateTipPos();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [tipOpen, updateTipPos]);

  if (groups.length === 0) {
    return <span className="text-sm text-slate-400">—</span>;
  }

  const overflow = groups.length - visibleCount;
  const tipLabel = groups.join(" · ");

  return (
    <>
      <div ref={containerRef} className="relative min-w-0 w-full">
        <div
          ref={measureRef}
          className="pointer-events-none invisible absolute left-0 top-0 flex whitespace-nowrap"
          style={{ gap: GROUPS_GAP_PX }}
          aria-hidden
        >
          {groups.map((g) => {
            const c = groupColor(g);
            return (
              <span
                key={g}
                data-group-pill
                className={cn(tagBase, c.bg, c.border, c.text, "shrink-0")}
              >
                {g}
              </span>
            );
          })}
          <span ref={ellipsisRef} className={cn(tagBase, "shrink-0")}>
            …
          </span>
        </div>

        <div
          className="flex min-w-0 items-center overflow-hidden"
          style={{ gap: GROUPS_GAP_PX }}
        >
          {groups.slice(0, visibleCount).map((g) => {
            const c = groupColor(g);
            return (
              <span
                key={g}
                className={cn(tagBase, c.bg, c.border, c.text, "shrink-0")}
              >
                {g}
              </span>
            );
          })}
          {overflow > 0 && (
            <span
              ref={tipAnchorRef}
              className={cn(
                tagBase,
                "shrink-0 border-border bg-muted text-muted-foreground"
              )}
              onMouseEnter={showTip}
              onMouseLeave={hideTip}
            >
              …
            </span>
          )}
        </div>
      </div>
      {tipOpen &&
        overflow > 0 &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[100] max-w-[min(360px,calc(100vw-16px))] break-words rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-md"
            style={{ top: tipPos.top, left: tipPos.left }}
          >
            {tipLabel}
          </div>,
          document.body
        )}
    </>
  );
}

type ContactsProps = {
  rows: ContactRowData[];
  loading: boolean;
  error: string | null;
  customFieldDefs?: CustomFieldDef[];
  unsubscribedContacts?: UnsubscribedContactRow[];
  onImport: () => void;
  onAddContact: () => void;
  onRowClick: (row: ContactRowData) => void;
  onDeleteContacts: (ids: string[]) => void;
  onCreateCampaignFromContacts: (ids: string[]) => void;
  onResubscribeContacts?: (ids: string[]) => Promise<void>;
};

function buildContactColumns(
  customFieldDefs: CustomFieldDef[],
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
): ColumnDef<ContactRowData, unknown>[] {
  const customCols: ColumnDef<ContactRowData, unknown>[] = customFieldDefs.map(
    (def) => ({
      id: `custom_${def.id}`,
      header: def.label,
      size: CONTACT_COL.customField,
      accessorFn: (row) => {
        const raw = row.customFields?.[def.id];
        if (raw == null) return undefined;
        const text = formatCustomFieldDisplay(raw, def.fieldType).trim();
        return text && text !== "—" ? text : undefined;
      },
      sortUndefined: "last",
      sortDescFirst: false,
      cell: ({ row }) => (
        <CellTruncate as="div">
          {formatCustomFieldDisplay(
            row.original.customFields?.[def.id],
            def.fieldType,
          )}
        </CellTruncate>
      ),
    }),
  );

  return [
  {
    id: "avatar",
    size: CONTACT_COL.avatar,
    minSize: CONTACT_COL.avatar,
    maxSize: CONTACT_COL.avatar,
    header: "",
    cell: ({ row }) => {
      const initials = contactInitials(row.original);
      const c = avatarColor(row.original.id);
      return (
        <div
          className={cn(
            "grid h-7 w-7 place-items-center rounded-full text-[11px] font-medium",
            c.bg,
            c.text
          )}
        >
          {initials}
        </div>
      );
    },
  },
  {
    accessorKey: "firstName",
    header: t("contacts.col.firstName"),
    size: CONTACT_COL.firstName,
    cell: ({ getValue }) => (
      <CellTruncate as="div" className="">
        {getValue<string>().trim() || "—"}
      </CellTruncate>
    ),
  },
  {
    accessorKey: "lastName",
    header: t("contacts.col.lastName"),
    size: CONTACT_COL.lastName,
    cell: ({ getValue }) => (
      <CellTruncate as="div" className="">
        {getValue<string>().trim() || "—"}
      </CellTruncate>
    ),
  },
  {
    accessorKey: "phone",
    header: t("contacts.col.phone"),
    size: CONTACT_COL.phone,
    cell: ({ getValue }) => (
      <div className="flex items-center gap-1.5">
        <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
        <CellTruncate as="span">{getValue<string>()}</CellTruncate>
      </div>
    ),
  },
  {
    accessorKey: "groups",
    header: t("contacts.col.groups"),
    size: CONTACT_COL.groups,
    enableSorting: false,
    cell: ({ getValue }) => (
      <ContactGroupsCell groups={getValue<string[]>() ?? []} />
    ),
    filterFn: (row, _columnId, filterValue: string) => {
      if (!filterValue) return true;
      return row.original.groups.some((g) =>
        g.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  },
  {
    id: "notes",
    header: t("contacts.col.notes"),
    size: CONTACT_COL.notes,
    accessorFn: (row) => {
      const n = row.notes.trim();
      return n || undefined;
    },
    sortUndefined: "last",
    sortDescFirst: false,
    cell: ({ row }) => (
      <CellTruncate as="div">
        {row.original.notes.trim() || "—"}
      </CellTruncate>
    ),
  },
  {
    id: "lastSms",
    header: t("contacts.col.lastSms"),
    size: CONTACT_COL.lastSms,
    accessorFn: (row) => row.lastSmsAt ?? undefined,
    sortingFn: (a, b) =>
      compareIsoTimestampsStable(
        a.original.lastSmsAt,
        b.original.lastSmsAt,
        a.original.id,
        b.original.id,
      ),
    sortUndefined: "last",
    sortDescFirst: false,
    cell: ({ row }) => {
      const date = row.original.lastSms;
      const body = row.original.lastSmsBody;
      if (!body && date === "—")
        return <span className="text-sm text-slate-400">—</span>;
      return (
        <div className="flex flex-col gap-0.5 truncate">
          {body ? (
            <span className="truncate text-sm text-slate-700">
              &laquo;&thinsp;{body.slice(0, 50)}
              {body.length > 50 ? "…" : ""}&thinsp;&raquo;
            </span>
          ) : null}
          {date !== "—" && (
            <span className="text-xs text-slate-400">{date}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "source",
    header: t("contacts.col.source"),
    size: CONTACT_COL.source,
    cell: ({ getValue }) => (
      <CellTruncate as="div">{getValue<string>()}</CellTruncate>
    ),
  },
  {
    id: "created",
    header: t("contacts.col.created"),
    size: CONTACT_COL.created,
    accessorFn: (row) => row.createdAt,
    sortingFn: (a, b) =>
      compareIsoTimestampsStable(
        a.original.createdAt,
        b.original.createdAt,
        a.original.id,
        b.original.id,
      ),
    sortDescFirst: false,
    cell: ({ row }) => (
      <CellTruncate as="div">{row.original.created}</CellTruncate>
    ),
  },
  /** Champs perso à droite (avant actions sticky). */
  ...customCols,
];
}

/** Largeur naturelle base + champs perso — force scroll horizontal si defs. */
function contactsTableMinWidth(customFieldCount: number): number | undefined {
  if (customFieldCount <= 0) return undefined;
  const base =
    CONTACT_COL.select +
    CONTACT_COL.avatar +
    CONTACT_COL.firstName +
    CONTACT_COL.lastName +
    CONTACT_COL.phone +
    CONTACT_COL.groups +
    CONTACT_COL.notes +
    CONTACT_COL.lastSms +
    CONTACT_COL.source +
    CONTACT_COL.created +
    CONTACT_COL.actions;
  return base + customFieldCount * CONTACT_COL.customField;
}

export function ContactsView({
  rows,
  loading,
  error,
  customFieldDefs = [],
  unsubscribedContacts = [],
  onImport,
  onAddContact,
  onRowClick,
  onDeleteContacts,
  onCreateCampaignFromContacts,
  onResubscribeContacts,
}: ContactsProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sorting, setSorting] = useState<SortingState>([]);
  const [unsubModalOpen, setUnsubModalOpen] = useState(false);

  const eligibleRows = useMemo(
    () => rows.filter((r) => isCampaignEligibleContact(r)),
    [rows]
  );

  const sortedRows = useMemo(
    () => sortContactRows(eligibleRows, sorting, customFieldDefs),
    [eligibleRows, sorting, customFieldDefs],
  );

  const selectedIdsRef = useRef(selectedIds);
  const eligibleRowsRef = useRef(eligibleRows);
  const onRowClickRef = useRef(onRowClick);
  const onDeleteContactsRef = useRef(onDeleteContacts);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
    eligibleRowsRef.current = eligibleRows;
    onRowClickRef.current = onRowClick;
    onDeleteContactsRef.current = onDeleteContacts;
  });

  const unsubCount = unsubscribedContacts.length;

  const hasSelection = selectedIds.size > 0;
  const showBigEmpty = !loading && !error && rows.length === 0;

  const footer = useMemo(() => {
    if (loading) return "…";
    const total = eligibleRows.length;
    const contactsLabel = t(
      total === 1 ? "contacts.footerOne" : "contacts.footerMany",
      { n: total },
    );
    if (unsubCount === 0) return contactsLabel;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span>
          {contactsLabel}
          <span className="text-muted-foreground/80">
            {" "}
            ·{" "}
            {t(
              unsubCount > 1 ? "contacts.unsubMany" : "contacts.unsubOne",
              { n: unsubCount },
            )}
          </span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 cursor-pointer px-2.5 text-xs font-semibold"
          onClick={() => setUnsubModalOpen(true)}
        >
          {t("contacts.viewUnsubList")}
        </Button>
      </div>
    );
  }, [loading, eligibleRows.length, unsubCount, t]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const rows = eligibleRowsRef.current;
      if (prev.size === rows.length) return new Set();
      return new Set(rows.map((r) => r.id));
    });
  }, []);

  const columns = useMemo(
    () => buildContactColumns(customFieldDefs, t),
    [customFieldDefs, t],
  );

  const minContentWidth = useMemo(
    () => contactsTableMinWidth(customFieldDefs.length),
    [customFieldDefs.length],
  );

  const selectColumns: ColumnDef<ContactRowData, unknown>[] = useMemo(
    () => [
    {
      id: "select",
      size: CONTACT_COL.select,
      minSize: CONTACT_COL.select,
      maxSize: CONTACT_COL.select,
      enableResizing: false,
      header: () => {
        const ids = selectedIdsRef.current;
        const total = eligibleRowsRef.current.length;
        return (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                ids.size > 0 && ids.size === total
                  ? true
                  : ids.size > 0
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={() => toggleAll()}
              aria-label={t("contacts.selectAllAria")}
            />
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={selectedIdsRef.current.has(row.original.id)}
            onCheckedChange={() => toggleSelect(row.original.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={t("contacts.selectOneAria", {
              name: row.original.name,
            })}
          />
        </div>
      ),
    },
    ...columns,
    {
      id: "actions",
      size: CONTACT_COL.actions,
      minSize: CONTACT_COL.actions,
      maxSize: CONTACT_COL.actions,
      enableResizing: false,
      header: () => null,
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7 rounded-full text-muted-foreground"
                aria-label={t("contacts.actionsAria", {
                  name: row.original.name,
                })}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onSelect={() => onRowClickRef.current(row.original)}
              >
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() =>
                  onDeleteContactsRef.current([row.original.id])
                }
              >
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ],
    [columns, t, toggleAll, toggleSelect],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <InputGroup
          className="max-w-sm bg-transparent dark:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0"
          role="search"
        >
          <InputGroupAddon align="inline-start">
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={t("contacts.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t("contacts.searchAria")}
          />
        </InputGroup>
        <div className="flex flex-wrap items-center gap-2">
          {hasSelection ? (
            <>
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full"
                onClick={() => {
                  onDeleteContacts(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}
              >
                <Trash2 aria-hidden />
                {t("contacts.deleteSelected", { n: selectedIds.size })}
              </Button>
              <Button
                variant="default"
                size="lg"
                className="rounded-full"
                onClick={() => {
                  onCreateCampaignFromContacts(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}
              >
                <Send aria-hidden />
                {t("contacts.createCampaign")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full"
                onClick={onImport}
              >
                <Download aria-hidden />
                {t("contacts.import")}
              </Button>
              <Button
                variant="default"
                size="lg"
                className="rounded-full"
                onClick={onAddContact}
              >
                <Plus aria-hidden />
                {t("contacts.add")}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
          {error}
        </div>
      )}

      {showBigEmpty ? (
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <UserRound
              className="h-14 w-14 text-slate-400"
              strokeWidth={1.25}
              aria-hidden
            />
            <p className="m-0 max-w-[360px] text-lg font-extrabold text-slate-800">
              {t("contacts.emptyTitle")}
            </p>
            <p className="m-0 max-w-[400px] text-sm font-semibold leading-relaxed text-slate-500">
              {t("contacts.emptyBody")}
            </p>
          </div>
        </section>
      ) : (
        <DataTable
          columns={selectColumns}
          data={sortedRows}
          loading={loading}
          pageSize={25}
          globalFilter={searchQuery}
          emptyMessage={t("contacts.emptyTable")}
          searchNoResultsMessage={t("contacts.noSearchResults")}
          onRowClick={onRowClick}
          footer={footer}
          minContentWidth={minContentWidth}
          sorting={sorting}
          onSortingChange={setSorting}
          manualSorting
        />
      )}

      <UnsubscribedContactsModal
        open={unsubModalOpen}
        contacts={unsubscribedContacts}
        onClose={() => setUnsubModalOpen(false)}
        onResubscribe={onResubscribeContacts}
      />
    </div>
  );
}
