import type { SupabaseClient } from "@supabase/supabase-js";

export type UserQrCodeRecord = {
  id: string;
  user_id: string;
  slug: string;
  public_label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function buildSlug(): string {
  const raw = crypto.randomUUID().replace(/-/g, "");
  return raw.slice(0, 14);
}

export async function getOrCreateUserQrCode(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: UserQrCodeRecord | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_qr_codes")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return { data: null, error: new Error(error.message) };
  if (data) return { data: data as UserQrCodeRecord, error: null };

  for (let i = 0; i < 3; i++) {
    const slug = buildSlug();
    const ins = await supabase
      .from("user_qr_codes")
      .insert({
        user_id: userId,
        slug,
        public_label: "Formulaire client",
        is_active: true,
      })
      .select("*")
      .single();
    if (!ins.error && ins.data) {
      return { data: ins.data as UserQrCodeRecord, error: null };
    }
    if (ins.error && ins.error.code !== "23505") {
      return { data: null, error: new Error(ins.error.message) };
    }
  }
  return {
    data: null,
    error: new Error("Impossible de générer un slug QR unique."),
  };
}

export async function regenerateUserQrCode(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: UserQrCodeRecord | null; error: Error | null }> {
  for (let i = 0; i < 3; i++) {
    const slug = buildSlug();
    const upd = await supabase
      .from("user_qr_codes")
      .update({
        slug,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("*")
      .single();
    if (!upd.error && upd.data) {
      return { data: upd.data as UserQrCodeRecord, error: null };
    }
    if (upd.error && upd.error.code !== "23505") {
      return { data: null, error: new Error(upd.error.message) };
    }
  }
  return {
    data: null,
    error: new Error("Impossible de régénérer le QR code."),
  };
}
