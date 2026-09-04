import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EMPTY_MERGE_FILL_COUNTS,
  type MergeFillCounts,
} from "@/lib/proto/smsMergeFill";

function asInt(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : fallback;
}

export function parseMergeFillCounts(raw: unknown): MergeFillCounts | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const customRaw = o.custom;
  const custom: Record<string, number> = {};
  if (customRaw && typeof customRaw === "object" && !Array.isArray(customRaw)) {
    for (const [k, v] of Object.entries(customRaw as Record<string, unknown>)) {
      custom[k] = asInt(v);
    }
  }
  return {
    total: asInt(o.total),
    prenom: asInt(o.prenom),
    nom: asInt(o.nom),
    anniversaire: asInt(o.anniversaire),
    custom,
  };
}

export async function fetchCampaignMergeFillCounts(
  supabase: SupabaseClient,
  args: {
    customIds: readonly string[];
    allEligible?: boolean;
    clientIds?: readonly string[];
    excludeIds?: readonly string[];
    search?: string;
  },
): Promise<{ data: MergeFillCounts; error: Error | null }> {
  const { data, error } = await supabase.rpc("campaign_merge_fill_counts", {
    p_custom_ids: [...args.customIds],
    p_all_eligible: Boolean(args.allEligible),
    p_client_ids: args.allEligible
      ? null
      : args.clientIds && args.clientIds.length > 0
        ? [...args.clientIds]
        : null,
    p_exclude_ids:
      args.allEligible && args.excludeIds && args.excludeIds.length > 0
        ? [...args.excludeIds]
        : null,
    p_search: args.allEligible ? (args.search ?? "") : null,
  });
  if (error) {
    return { data: EMPTY_MERGE_FILL_COUNTS, error: new Error(error.message) };
  }
  const parsed = parseMergeFillCounts(data);
  if (!parsed) {
    return { data: EMPTY_MERGE_FILL_COUNTS, error: new Error("Réponse RPC invalide") };
  }
  return { data: parsed, error: null };
}
