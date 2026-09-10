import {
  automationKindDescription,
  automationScheduleLabel,
} from "@/lib/automations/scheduleLabel";
import { AUTOMATION_PRESETS, presetByKey } from "@/lib/automations/presets";
import type {
  AutomationKind,
  AutomationPresetKey,
  AutomationRecurrenceUnit,
  AutomationRowData,
  AutomationSavePayload,
} from "@/lib/types/automation";
import type { SupabaseClient } from "@supabase/supabase-js";

type AutomationRecord = {
  id: string;
  user_id: string;
  preset_key: string | null;
  kind: string;
  name: string;
  body: string;
  enabled: boolean;
  send_time: string;
  fixed_month: number | null;
  fixed_day: number | null;
  recurrence_unit: AutomationRecurrenceUnit | null;
  recurrence_interval: number | null;
  recurrence_weekday: number | null;
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

function schedulePartsFromRecord(record: AutomationRecord) {
  return {
    fixedMonth: record.fixed_month,
    fixedDay: record.fixed_day,
    recurrenceUnit: record.recurrence_unit,
    recurrenceInterval: record.recurrence_interval,
    recurrenceWeekday: record.recurrence_weekday,
  };
}

function recordToPresetRow(
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
    kind: record.kind as AutomationKind,
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

function recordToCustomRow(record: AutomationRecord): AutomationRowData {
  const kind = record.kind as AutomationKind;
  const parts = schedulePartsFromRecord(record);
  return {
    id: record.id,
    presetKey: null,
    kind,
    name: record.name,
    description: automationKindDescription(kind),
    scheduleLabel: automationScheduleLabel(kind, parts),
    body: record.body,
    enabled: record.enabled,
    sendTime: sendTimeFromDb(record.send_time),
    fixedMonth: record.fixed_month ?? undefined,
    fixedDay: record.fixed_day ?? undefined,
    recurrenceUnit: record.recurrence_unit ?? undefined,
    recurrenceInterval: record.recurrence_interval ?? undefined,
    recurrenceWeekday: record.recurrence_weekday ?? undefined,
    persisted: true,
  };
}

function customRowFromPayload(
  userId: string,
  payload: Extract<AutomationSavePayload, { mode: "custom" }>,
) {
  const body = payload.body.trim();
  return {
    user_id: userId,
    preset_key: null,
    kind: payload.kind,
    name: payload.name.trim(),
    body,
    enabled: payload.enabled,
    send_time: sendTimeToDb(payload.sendTime),
    fixed_month:
      payload.kind === "fixed_date" ? (payload.fixedMonth ?? null) : null,
    fixed_day:
      payload.kind === "fixed_date" ? (payload.fixedDay ?? null) : null,
    recurrence_unit:
      payload.kind === "recurring" ? (payload.recurrenceUnit ?? null) : null,
    recurrence_interval:
      payload.kind === "recurring" ? (payload.recurrenceInterval ?? null) : null,
    recurrence_weekday:
      payload.kind === "recurring" ? (payload.recurrenceWeekday ?? null) : null,
    updated_at: new Date().toISOString(),
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

  const records = (data ?? []) as AutomationRecord[];
  const byKey = new Map<string, AutomationRecord>();
  const customRows: AutomationRowData[] = [];

  for (const row of records) {
    if (row.preset_key) {
      byKey.set(row.preset_key, row);
    } else {
      customRows.push(recordToCustomRow(row));
    }
  }

  const presetRows = AUTOMATION_PRESETS.map((p) =>
    recordToPresetRow(byKey.get(p.key) ?? null, p.key),
  );

  customRows.sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return { data: [...presetRows, ...customRows], error: null };
}

export async function saveAutomation(
  supabase: SupabaseClient,
  userId: string,
  payload: AutomationSavePayload,
): Promise<{ error: Error | null }> {
  if (payload.mode === "preset") {
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
      recurrence_unit: null,
      recurrence_interval: null,
      recurrence_weekday: null,
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

  const row = customRowFromPayload(userId, payload);

  if (payload.id) {
    const { error } = await supabase
      .from("sms_automations")
      .update(row)
      .eq("id", payload.id)
      .eq("user_id", userId)
      .is("preset_key", null);

    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  }

  const { error } = await supabase.from("sms_automations").insert(row);

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}

/** @deprecated Préférer `saveAutomation`. */
export async function upsertAutomation(
  supabase: SupabaseClient,
  userId: string,
  payload: AutomationSavePayload,
): Promise<{ error: Error | null }> {
  return saveAutomation(supabase, userId, payload);
}
