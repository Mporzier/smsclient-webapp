"use client";

import { DataTable } from "@/components/smsclient/DataTable";
import { brandBtnCls } from "@/components/smsclient/modals/modalChrome";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import type { CreditPurchaseRowData } from "@/lib/types/credits";
import type {
  ColumnDef,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table";
import { useMemo } from "react";

export function InvoicesTable({
  purchases,
  loading,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  onInvoiceClick,
  sorting,
  onSortingChange,
}: {
  purchases: CreditPurchaseRowData[];
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onInvoiceClick?: (id: string) => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
}) {
  const { t } = useI18n();

  const cols = useMemo((): ColumnDef<CreditPurchaseRowData, unknown>[] => {
    const base: ColumnDef<CreditPurchaseRowData, unknown>[] = [
      { accessorKey: "createdLabel", header: t("invoices.col.date") },
      {
        accessorKey: "packLabel",
        header: t("invoices.col.pack"),
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
      },
      { accessorKey: "amountLabel", header: t("invoices.col.price"), size: 90 },
      {
        accessorKey: "status",
        header: t("invoices.col.status"),
        size: 100,
        cell: ({ getValue }) => {
          const status = getValue<string>();
          return status === "paid" ? (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-500/12 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
              {t("invoices.status.paid")}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {t("invoices.status.refunded")}
            </span>
          );
        },
      },
      {
        accessorKey: "creditsLabel",
        header: t("invoices.col.credits"),
        size: 80,
      },
    ];

    if (!onInvoiceClick) return base;

    return [
      ...base,
      {
        id: "actions",
        header: t("invoices.col.pdf"),
        size: 140,
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="lg"
            className={cn(brandBtnCls, "h-8 px-2.5 text-xs")}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onInvoiceClick(row.original.invoiceRef);
            }}
          >
            {t("invoices.download")}
          </Button>
        ),
      },
    ];
  }, [onInvoiceClick, t]);

  const footer =
    purchases.length === 1
      ? t("invoices.footerOne")
      : t("invoices.footerMany", { n: purchases.length });

  return (
    <DataTable
      columns={cols}
      data={purchases}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      emptyMessage={t("invoices.empty")}
      loadingMessage={t("invoices.loading")}
      footer={footer}
      sorting={sorting}
      onSortingChange={onSortingChange}
      manualSorting
    />
  );
}
