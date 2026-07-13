"use client";

import { DataTable } from "@/components/smsclient/DataTable";
import { brandBtnCls } from "@/components/smsclient/modals/modalChrome";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { CreditPurchaseRowData } from "@/lib/types/credits";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { invoiceColumns } from "./parametresSettings";

export function InvoicesTable({
  purchases,
  loading,
  onInvoiceClick,
}: {
  purchases: CreditPurchaseRowData[];
  loading: boolean;
  onInvoiceClick?: (id: string) => void;
}) {
  const cols = useMemo(
    (): ColumnDef<CreditPurchaseRowData, unknown>[] => [
      ...invoiceColumns,
      ...(onInvoiceClick
        ? [
            {
              id: "actions",
              header: "PDF",
              size: 140,
              cell: ({ row }: { row: { original: CreditPurchaseRowData } }) => (
                <Button
                  variant="outline"
                  size="lg"
                  className={cn(brandBtnCls, "h-8 px-2.5 text-xs")}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onInvoiceClick(row.original.invoiceRef);
                  }}
                >
                  Télécharger
                </Button>
              ),
            } as ColumnDef<CreditPurchaseRowData, unknown>,
          ]
        : []),
    ],
    [onInvoiceClick]
  );

  return (
    <DataTable
      columns={cols}
      data={purchases}
      loading={loading}
      pageSize={10}
      emptyMessage="Aucune facture pour l'instant."
      loadingMessage="Chargement des factures…"
      footer={`${purchases.length} facture${purchases.length > 1 ? "s" : ""}`}
    />
  );
}
