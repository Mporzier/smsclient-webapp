import {
  normalizeListColumnVisibility,
  parseListColumnVisibilityStore,
  type ListColumnPrefsKey,
  type ListColumnVisibilityStore,
} from "@/lib/types/listColumnPreferences";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { VisibilityState } from "@tanstack/react-table";

export async function fetchListColumnVisibility(
  supabase: SupabaseClient,
  userId: string,
  listKey: ListColumnPrefsKey,
): Promise<{ visibility: VisibilityState; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("list_column_visibility")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { visibility: {}, error: new Error(error.message) };
  }

  const store = parseListColumnVisibilityStore(data?.list_column_visibility);
  return { visibility: store[listKey] ?? {}, error: null };
}

export async function saveListColumnVisibility(
  supabase: SupabaseClient,
  userId: string,
  listKey: ListColumnPrefsKey,
  visibility: VisibilityState,
): Promise<{ error: Error | null }> {
  const { data, error: readError } = await supabase
    .from("user_profiles")
    .select("list_column_visibility")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    return { error: new Error(readError.message) };
  }

  const store: ListColumnVisibilityStore = parseListColumnVisibilityStore(
    data?.list_column_visibility,
  );
  const normalized = normalizeListColumnVisibility(visibility);
  const nextStore: ListColumnVisibilityStore = {
    ...store,
    [listKey]: normalized,
  };

  const { error: writeError } = await supabase
    .from("user_profiles")
    .update({ list_column_visibility: nextStore })
    .eq("user_id", userId);

  if (writeError) {
    return { error: new Error(writeError.message) };
  }
  return { error: null };
}
