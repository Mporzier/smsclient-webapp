import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreditPurchaseRowData } from "@/lib/types/credits";
import { LIST_PAGE_SIZE } from "@/lib/supabase/postgrestChunk";

type SmsCreditsAccountRecord = {
  user_id: string;
  balance: number;
};

type SmsCreditPurchaseRecord = {
  id: string;
  user_id: string;
  pack_code: string;
  pack_label: string;
  credits: number;
  amount_cents: number;
  currency: string;
  status: "paid" | "refunded";
  invoice_ref: string;
  created_at: string;
};

export type BuyCreditsInput = {
  packCode: string;
  packLabel: string;
  credits: number;
  amountEur: number;
};

export type CreditsSnapshot = {
  balance: number;
  balanceLabel: string;
  purchases: CreditPurchaseRowData[];
};

function formatNumberFr(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatDateFr(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatAmountEur(amountCents: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(amountCents / 100)} €`;
}

function buildInvoiceRef(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const stamp = `${date.getHours()}${date.getMinutes()}${date.getSeconds()}${date.getMilliseconds()}`;
  const random = `${Math.floor(Math.random() * 9000) + 1000}`;
  return `FAC-${year}${month}${day}-${stamp}-${random}`;
}

function toPurchaseRow(r: SmsCreditPurchaseRecord): CreditPurchaseRowData {
  return {
    id: r.id,
    invoiceRef: r.invoice_ref,
    createdLabel: formatDateFr(r.created_at),
    packLabel: r.pack_label,
    creditsLabel: formatNumberFr(r.credits),
    amountLabel: formatAmountEur(r.amount_cents),
    status: r.status,
  };
}

async function ensureCreditsAccount(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("sms_credits_accounts")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}

export async function fetchCreditsSnapshot(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: CreditsSnapshot; error: Error | null }> {
  const ensure = await ensureCreditsAccount(supabase, userId);
  if (ensure.error) {
    return {
      data: { balance: 0, balanceLabel: "0", purchases: [] },
      error: ensure.error,
    };
  }

  const { data: account, error: accountError } = await supabase
    .from("sms_credits_accounts")
    .select("user_id,balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (accountError) {
    return {
      data: { balance: 0, balanceLabel: "0", purchases: [] },
      error: new Error(accountError.message),
    };
  }

  const balance = (account as SmsCreditsAccountRecord | null)?.balance ?? 0;
  const purchasesRes = await fetchCreditPurchasesPage(supabase, userId, {
    offset: 0,
    limit: LIST_PAGE_SIZE,
    search: "",
    includeTotal: true,
  });

  if (purchasesRes.error) {
    return {
      data: { balance, balanceLabel: formatNumberFr(balance), purchases: [] },
      error: purchasesRes.error,
    };
  }

  return {
    data: {
      balance,
      balanceLabel: formatNumberFr(balance),
      purchases: purchasesRes.data,
    },
    error: null,
  };
}

function escapeIlike(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function fetchCreditPurchasesPage(
  supabase: SupabaseClient,
  userId: string,
  args: { offset: number; limit?: number; search?: string; includeTotal?: boolean },
): Promise<{
  data: CreditPurchaseRowData[];
  hasMore: boolean;
  totalCount?: number;
  error: Error | null;
}> {
  const limit = args.limit ?? LIST_PAGE_SIZE;
  const offset = Math.max(0, args.offset);
  const q = (args.search ?? "").trim();
  const includeTotal = args.includeTotal ?? offset === 0;

  let query = supabase
    .from("sms_credit_purchases")
    .select("*", { count: includeTotal ? "exact" : undefined })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    const safe = escapeIlike(q);
    const p = `"%${safe.replace(/"/g, '\\"')}%"`;
    query = query.or(`pack_label.ilike.${p},invoice_ref.ilike.${p}`);
  }

  const { data, error, count } = await query;
  if (error) {
    return { data: [], hasMore: false, error: new Error(error.message) };
  }

  const rows = (data ?? []) as SmsCreditPurchaseRecord[];
  return {
    data: rows.map(toPurchaseRow),
    hasMore: rows.length === limit,
    totalCount: includeTotal && typeof count === "number" ? count : undefined,
    error: null,
  };
}

/**
 * Achat dummy (pas de Stripe) :
 * - création d'une facture simulée
 * - insertion dans l'historique
 * - incrément du solde du compte.
 */
export async function buyCreditsDummy(
  supabase: SupabaseClient,
  userId: string,
  input: BuyCreditsInput,
): Promise<{ invoiceRef: string | null; error: Error | null }> {
  if (input.credits <= 0) {
    return { invoiceRef: null, error: new Error("Le nombre de crédits doit être positif.") };
  }
  if (input.amountEur < 0) {
    return { invoiceRef: null, error: new Error("Le montant est invalide.") };
  }

  const ensure = await ensureCreditsAccount(supabase, userId);
  if (ensure.error) {
    return { invoiceRef: null, error: ensure.error };
  }

  const { data: account, error: accountError } = await supabase
    .from("sms_credits_accounts")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (accountError) {
    return { invoiceRef: null, error: new Error(accountError.message) };
  }

  const now = new Date();
  const invoiceRef = buildInvoiceRef(now);
  const amountCents = Math.round(input.amountEur * 100);

  const { error: purchaseError } = await supabase.from("sms_credit_purchases").insert({
    user_id: userId,
    pack_code: input.packCode.trim(),
    pack_label: input.packLabel.trim(),
    credits: input.credits,
    amount_cents: amountCents,
    currency: "EUR",
    status: "paid",
    invoice_ref: invoiceRef,
  });

  if (purchaseError) {
    return { invoiceRef: null, error: new Error(purchaseError.message) };
  }

  const nextBalance = ((account as { balance: number }).balance ?? 0) + input.credits;
  const { error: updateError } = await supabase
    .from("sms_credits_accounts")
    .update({ balance: nextBalance })
    .eq("user_id", userId);

  if (updateError) {
    return { invoiceRef: null, error: new Error(updateError.message) };
  }

  return { invoiceRef, error: null };
}
