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

export type BillingInfo = {
  companyName: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
};

export type PaymentMethodBrand = "visa" | "mastercard" | "amex" | "unknown";

export type PaymentMethodInfo = {
  brand: PaymentMethodBrand;
  last4: string;
  expMonth: number;
  expYear: number;
};
