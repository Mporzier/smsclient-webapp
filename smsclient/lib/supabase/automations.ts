import type { SupabaseClient } from "@supabase/supabase-js";
import { AUTOMATION_PRESETS, presetByKey } from "@/lib/automations/presets";
import type {
  AutomationPresetKey,
  AutomationRowData,
  AutomationSavePayload,
} from "@/lib/types/automation";

type AutomationRecord = {
  id: string;
  user_id: string;
  preset_key: string;
  kind: string;
  name: string;
  body: string;
  enabled: boolean;
  send_time: string;
  fixed_month: number | null;
  fixed_day: number | null;
};

function sendTimeFromDb(raw: string): string {
  const m = /^(\d{2}):(\d{2})/.exec(raw.trim());
  if (m) return `${m[1]}:${m[2]}`;
  return "09:00";
}

function sendTimeToDb(value: string): string {
  const t = value.trim();
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  return "09:00:00";
}

function recordToRow(
  record: AutomationRecord | null,
  presetKey: AutomationPresetKey,
): AutomationRowData {
  const preset = presetByKey(presetKey);
  if (!record) {
    return {
      id: null,
      presetKey,
      kind: preset.kind,
      name: preset.name,
      description: preset.description,
      scheduleLabel: preset.scheduleLabel,
      body: preset.defaultBody,
      enabled: false,
      sendTime: "09:00",
      fixedMonth: preset.fixedMonth,
      fixedDay: preset.fixedDay,
      persisted: false,
    };
  }
  return {
    id: record.id,
    presetKey,
    kind: record.kind as AutomationRowData["kind"],
    name: record.name,
    description: preset.description,
    scheduleLabel: preset.scheduleLabel,
    body: record.body.trim() || preset.defaultBody,
    enabled: record.enabled,
    sendTime: sendTimeFromDb(record.send_time),
    fixedMonth: record.fixed_month ?? preset.fixedMonth,
    fixedDay: record.fixed_day ?? preset.fixedDay,
    persisted: true,
  };
}

export async function fetchAutomations(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: AutomationRowData[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("sms_automations")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const byKey = new Map<string, AutomationRecord>();
  for (const row of (data ?? []) as AutomationRecord[]) {
    byKey.set(row.preset_key, row);
  }

  const merged = AUTOMATION_PRESETS.map((p) =>
    recordToRow(byKey.get(p.key) ?? null, p.key),
  );
  return { data: merged, error: null };
}

export async function upsertAutomation(
  supabase: SupabaseClient,
  userId: string,
  payload: AutomationSavePayload,
): Promise<{ error: Error | null }> {
  const preset = presetByKey(payload.presetKey);
  const body = payload.body.trim() || preset.defaultBody;

  const row = {
    user_id: userId,
    preset_key: payload.presetKey,
    kind: preset.kind,
    name: preset.name,
    body,
    enabled: payload.enabled,
    send_time: sendTimeToDb(payload.sendTime),
    fixed_month: preset.fixedMonth ?? null,
    fixed_day: preset.fixedDay ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("sms_automations")
    .upsert(row, { onConflict: "user_id,preset_key" });

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}
