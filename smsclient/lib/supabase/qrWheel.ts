import { defaultWheelSegments } from "@/lib/qr/wheelDefaults";
import type {
  QrWheelConfig,
  QrWheelPublicConfig,
  QrWheelSegment,
  QrWheelSpinResult,
} from "@/lib/types/qrWheel";
import type { SupabaseClient } from "@supabase/supabase-js";

type SegmentRow = {
  id: string;
  user_id: string;
  sort_order: number;
  label: string;
  probability_weight: number;
  is_losing: boolean;
  screen_message: string;
  sms_message: string;
  color: string;
};

function rowToSegment(row: SegmentRow): QrWheelSegment {
  return {
    id: row.id,
    sortOrder: row.sort_order,
    label: row.label,
    probabilityWeight: row.probability_weight,
    isLosing: row.is_losing,
    screenMessage: row.screen_message,
    smsMessage: row.sms_message,
    color: row.color,
  };
}

export async function fetchWheelConfig(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: QrWheelConfig | null; error: Error | null }> {
  const { data: qrRow, error: qrErr } = await supabase
    .from("user_qr_codes")
    .select(
      "wheel_enabled, wheel_title, wheel_subtitle, wheel_allow_repeat, wheel_prize_validity_days, wheel_send_prize_sms",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (qrErr) {
    return { data: null, error: new Error(qrErr.message) };
  }
  if (!qrRow) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from("qr_wheel_segments")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order")
    .order("created_at");

  if (error) {
    return {
      data: wheelConfigFromQrRow(qrRow, []),
      error: new Error(error.message),
    };
  }

  const segments = (data as SegmentRow[]).map(rowToSegment);
  return {
    data: wheelConfigFromQrRow(qrRow, segments),
    error: null,
  };
}

type QrWheelSettingsRow = {
  wheel_enabled: boolean | null;
  wheel_title: string | null;
  wheel_subtitle: string | null;
  wheel_allow_repeat: boolean | null;
  wheel_prize_validity_days: number | null;
  wheel_send_prize_sms: boolean | null;
};

function wheelConfigFromQrRow(
  qr: QrWheelSettingsRow,
  segments: QrWheelSegment[],
): QrWheelConfig {
  return {
    enabled: qr.wheel_enabled ?? false,
    title: qr.wheel_title ?? "Tournez la roue !",
    subtitle: qr.wheel_subtitle ?? "",
    allowRepeat: qr.wheel_allow_repeat ?? false,
    prizeValidityDays: qr.wheel_prize_validity_days ?? 30,
    sendPrizeSms: qr.wheel_send_prize_sms ?? true,
    segments,
  };
}

export async function saveWheelSettings(
  supabase: SupabaseClient,
  userId: string,
  settings: Pick<
    QrWheelConfig,
    | "enabled"
    | "title"
    | "subtitle"
    | "allowRepeat"
    | "prizeValidityDays"
    | "sendPrizeSms"
  >,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("user_qr_codes")
    .update({
      wheel_enabled: settings.enabled,
      wheel_title: settings.title.trim() || "Tournez la roue !",
      wheel_subtitle: settings.subtitle.trim(),
      wheel_allow_repeat: settings.allowRepeat,
      wheel_prize_validity_days: settings.prizeValidityDays,
      wheel_send_prize_sms: settings.sendPrizeSms,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) return { error: new Error(error.message) };
  return { error: null };
}

export async function seedDefaultWheelSegments(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ error: Error | null }> {
  const { count, error: countErr } = await supabase
    .from("qr_wheel_segments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countErr) return { error: new Error(countErr.message) };
  if ((count ?? 0) > 0) return { error: null };

  const rows = defaultWheelSegments().map((s) => ({
    user_id: userId,
    sort_order: s.sortOrder,
    label: s.label,
    probability_weight: s.probabilityWeight,
    is_losing: s.isLosing,
    screen_message: s.screenMessage,
    sms_message: s.smsMessage,
    color: s.color,
  }));

  const { error } = await supabase.from("qr_wheel_segments").insert(rows);
  if (error) return { error: new Error(error.message) };
  return { error: null };
}

export async function replaceWheelSegments(
  supabase: SupabaseClient,
  userId: string,
  segments: QrWheelSegment[],
): Promise<{ error: Error | null }> {
  const { error: delErr } = await supabase
    .from("qr_wheel_segments")
    .delete()
    .eq("user_id", userId);
  if (delErr) return { error: new Error(delErr.message) };

  if (segments.length === 0) return { error: null };

  const rows = segments.map((s, i) => ({
    user_id: userId,
    sort_order: i,
    label: s.label.trim(),
    probability_weight: s.probabilityWeight,
    is_losing: s.isLosing,
    screen_message: s.screenMessage.trim(),
    sms_message: s.smsMessage.trim(),
    color: s.color,
  }));

  const { error } = await supabase.from("qr_wheel_segments").insert(rows);
  if (error) return { error: new Error(error.message) };
  return { error: null };
}

export function parsePublicWheelConfig(raw: unknown): QrWheelPublicConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const w = raw as Record<string, unknown>;
  const segments = Array.isArray(w.segments)
    ? w.segments
        .map((s) => {
          if (!s || typeof s !== "object") return null;
          const o = s as Record<string, unknown>;
          if (typeof o.id !== "string" || typeof o.label !== "string") return null;
          return {
            id: o.id,
            label: o.label,
            color: typeof o.color === "string" ? o.color : "#4a86ff",
            is_losing: Boolean(o.is_losing),
          };
        })
        .filter((x): x is QrWheelPublicConfig["segments"][0] => x != null)
    : [];
  return {
    enabled: Boolean(w.enabled),
    title: typeof w.title === "string" ? w.title : "Tournez la roue !",
    subtitle: typeof w.subtitle === "string" ? w.subtitle : "",
    segments,
  };
}

export async function fetchPublicQrConfig(
  supabase: SupabaseClient,
  slug: string,
): Promise<{
  ok: boolean;
  wheel: QrWheelPublicConfig | null;
  error?: string;
}> {
  const { data, error } = await supabase.rpc("get_qr_public_config", {
    p_slug: slug,
  });
  if (error) return { ok: false, wheel: null, error: error.message };
  const payload = data as { ok?: boolean; error?: string; wheel?: unknown };
  if (!payload?.ok) {
    return { ok: false, wheel: null, error: payload?.error };
  }
  return {
    ok: true,
    wheel: parsePublicWheelConfig(payload.wheel),
  };
}

export function parseSpinResult(raw: unknown): QrWheelSpinResult | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!o.ok) return null;
  return {
    segmentId: String(o.segment_id ?? ""),
    label: String(o.label ?? ""),
    screenMessage: String(o.screen_message ?? o.label ?? ""),
    smsMessage: String(o.sms_message ?? ""),
    isLosing: Boolean(o.is_losing),
    validUntil: o.valid_until ? String(o.valid_until) : null,
    sendPrizeSms: Boolean(o.send_prize_sms),
  };
}

export async function spinQrWheel(
  supabase: SupabaseClient,
  slug: string,
  phoneE164: string,
): Promise<{ data: QrWheelSpinResult | null; error: string | null }> {
  const { data, error } = await supabase.rpc("spin_qr_wheel", {
    p_slug: slug,
    p_phone_e164: phoneE164,
  });
  if (error) return { data: null, error: error.message };
  const payload = data as Record<string, unknown>;
  if (!payload?.ok) {
    return { data: null, error: String(payload?.error ?? "spin_failed") };
  }
  return { data: parseSpinResult(payload), error: null };
}
