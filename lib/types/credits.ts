export type SmsCreditPurchaseStatus = "paid" | "refunded";

export type CreditPurchaseRowData = {
  id: string;
  invoiceRef: string;
  createdLabel: string;
  packLabel: string;
  creditsLabel: string;
  amountLabel: string;
  status: SmsCreditPurchaseStatus;
};
