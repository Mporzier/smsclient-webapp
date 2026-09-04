import type { SupabaseClient } from "@supabase/supabase-js";
import { clientRecordToRow, type ClientRecord } from "@/lib/supabase/clients";
import type { ContactRowData } from "@/lib/types/contact";
import type { CustomFieldValues } from "@/lib/types/customFields";

type CampaignClientRpcRow = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  phone_e164: string;
  group_label: string;
  notes: string;
  birthday: string | null;
  custom_fields: CustomFieldValues | null;
  last_sms_sent_at: string | null;
  last_sms_body: string | null;
  unsubscribed_at: string | null;
  source: string;
  opt_in: boolean;
  stop_sms: boolean;
  groups: string[] | null;
};

function parseCampaignClientRow(raw: unknown): ContactRowData | null {
  if (raw == null || typeof raw !== "object") return null;
  const row = raw as CampaignClientRpcRow;
  if (typeof row.id !== "string") return null;
  const groups = Array.isArray(row.groups)
    ? row.groups.filter((g): g is string => typeof g === "string")
    : [];
  const record: ClientRecord = {
    id: row.id,
    user_id: "",
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    phone_e164: row.phone_e164 ?? "",
    group_label: row.group_label ?? "",
    notes: row.notes ?? "",
    birthday: row.birthday,
    custom_fields: row.custom_fields,
    source: row.source ?? "",
    opt_in: row.opt_in ?? false,
    stop_sms: row.stop_sms ?? false,
    last_sms_sent_at: row.last_sms_sent_at,
    last_sms_body: row.last_sms_body,
    unsubscribed_at: row.unsubscribed_at,
    created_at: row.created_at ?? new Date(0).toISOString(),
  };
  return clientRecordToRow(record, groups);
}

export async function listClientIdsRpc(
  supabase: SupabaseClient,
  args: { search?: string; eligibleOnly: boolean },
): Promise<{ data: string[]; error: Error | null }> {
  const { data, error } = await supabase.rpc("list_client_ids", {
    p_search: args.search ?? "",
    p_eligible_only: args.eligibleOnly,
  });
  if (error) return { data: [], error: new Error(error.message) };
  if (!Array.isArray(data)) return { data: [], error: null };
  return {
    data: data.filter((id): id is string => typeof id === "string"),
    error: null,
  };
}

export async function fetchClientsForCampaignRpc(
  supabase: SupabaseClient,
  args: {
    search?: string;
    eligibleOnly?: boolean;
    clientIds?: readonly string[];
    allEligible?: boolean;
    excludeIds?: readonly string[];
  },
): Promise<{ data: ContactRowData[]; error: Error | null }> {
  const { data, error } = await supabase.rpc("fetch_clients_for_campaign", {
    p_search: args.search ?? "",
    p_eligible_only: args.eligibleOnly ?? true,
    p_client_ids:
      args.allEligible || !args.clientIds?.length ? null : [...args.clientIds],
    p_all_eligible: Boolean(args.allEligible),
    p_exclude_ids:
      args.allEligible && args.excludeIds && args.excludeIds.length > 0
        ? [...args.excludeIds]
        : null,
  });
  if (error) return { data: [], error: new Error(error.message) };
  if (!Array.isArray(data)) return { data: [], error: null };
  const rows: ContactRowData[] = [];
  for (const raw of data) {
    const parsed = parseCampaignClientRow(raw);
    if (parsed) rows.push(parsed);
  }
  return { data: rows, error: null };
}
