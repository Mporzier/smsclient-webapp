import type { SupabaseClient } from "@supabase/supabase-js";

export type ReferralDashboard = {
  code: string;
  signupCount: number;
};

export async function fetchReferralDashboard(
  supabase: SupabaseClient,
): Promise<{ data: ReferralDashboard | null; error: string | null }> {
  const { data: code, error: codeError } = await supabase.rpc(
    "ensure_user_referral_code",
  );

  if (codeError) {
    return { data: null, error: codeError.message };
  }
  if (typeof code !== "string" || !code) {
    return { data: null, error: "Code parrainage indisponible." };
  }

  const { data: countRaw, error: countError } = await supabase.rpc(
    "count_my_referrals",
  );

  if (countError) {
    return { data: null, error: countError.message };
  }

  const signupCount =
    typeof countRaw === "number"
      ? countRaw
      : typeof countRaw === "string"
        ? Number.parseInt(countRaw, 10) || 0
        : 0;

  return { data: { code, signupCount }, error: null };
}
