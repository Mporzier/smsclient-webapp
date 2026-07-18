import type { SupabaseClient } from "@supabase/supabase-js";

export async function listFavorites(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: string[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("sms_automation_favorites")
    .select("automation_id")
    .eq("user_id", userId);

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const ids = (data ?? [])
    .map((row) =>
      typeof row.automation_id === "string" ? row.automation_id : "",
    )
    .filter(Boolean);

  return { data: ids, error: null };
}

export async function addFavorite(
  supabase: SupabaseClient,
  userId: string,
  automationId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("sms_automation_favorites").insert({
    user_id: userId,
    automation_id: automationId,
  });
  if (error) return { error: new Error(error.message) };
  return { error: null };
}

export async function removeFavorite(
  supabase: SupabaseClient,
  userId: string,
  automationId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("sms_automation_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("automation_id", automationId);
  if (error) return { error: new Error(error.message) };
  return { error: null };
}
