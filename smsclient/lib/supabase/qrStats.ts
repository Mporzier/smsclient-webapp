import type { SupabaseClient } from "@supabase/supabase-js";

export const QR_CAPTURE_SOURCE = "QR boutique";

export type QrCaptureStats = {
  totalRegistrations: number;
  optInRegistrations: number;
  wheelSpins: number;
};

export async function fetchQrCaptureStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: QrCaptureStats | null; error: Error | null }> {
  const [totalRes, optInRes, spinsRes] = await Promise.all([
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("source", QR_CAPTURE_SOURCE)
      .is("deleted_at", null),
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("source", QR_CAPTURE_SOURCE)
      .eq("opt_in", true)
      .is("deleted_at", null),
    supabase
      .from("qr_wheel_spins")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (totalRes.error) {
    return { data: null, error: new Error(totalRes.error.message) };
  }
  if (optInRes.error) {
    return { data: null, error: new Error(optInRes.error.message) };
  }
  if (spinsRes.error) {
    return { data: null, error: new Error(spinsRes.error.message) };
  }

  return {
    data: {
      totalRegistrations: totalRes.count ?? 0,
      optInRegistrations: optInRes.count ?? 0,
      wheelSpins: spinsRes.count ?? 0,
    },
    error: null,
  };
}
