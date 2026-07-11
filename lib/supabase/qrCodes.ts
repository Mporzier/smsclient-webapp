import type { SupabaseClient } from "@supabase/supabase-js";

export type UserQrCodeRecord = {
  id: string;
  user_id: string;
  slug: string;
  public_label: string;
  is_active: boolean;
  welcome_sms_enabled: boolean;
  welcome_sms_template: string;
  wheel_enabled: boolean;
  wheel_title: string;
  wheel_subtitle: string;
  wheel_allow_repeat: boolean;
  wheel_prize_validity_days: number;
  wheel_send_prize_sms: boolean;
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

export type QrCaptureMode = "welcome" | "wheel" | "none";

export type UserQrWelcomeSmsPatch = {
  enabled?: boolean;
  template?: string;
};

export function qrCaptureModeFromRecord(
  record: Pick<UserQrCodeRecord, "welcome_sms_enabled" | "wheel_enabled"> | null,
): QrCaptureMode {
  if (!record) return "none";
  if (record.wheel_enabled) return "wheel";
  if (record.welcome_sms_enabled) return "welcome";
  return "none";
}

export async function setQrCaptureMode(
  supabase: SupabaseClient,
  userId: string,
  mode: QrCaptureMode,
): Promise<{ data: UserQrCodeRecord | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_qr_codes")
    .update({
      welcome_sms_enabled: mode === "welcome",
      wheel_enabled: mode === "wheel",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as UserQrCodeRecord, error: null };
}

export async function updateUserQrWelcomeSms(
  supabase: SupabaseClient,
  userId: string,
  patch: UserQrWelcomeSmsPatch,
): Promise<{ data: UserQrCodeRecord | null; error: Error | null }> {
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.enabled !== undefined) update.welcome_sms_enabled = patch.enabled;
  if (patch.template !== undefined) update.welcome_sms_template = patch.template;

  const { data, error } = await supabase
    .from("user_qr_codes")
    .update(update)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as UserQrCodeRecord, error: null };
}
