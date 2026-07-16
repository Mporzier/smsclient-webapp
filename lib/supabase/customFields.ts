import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CUSTOM_FIELD_MAX_PER_ACCOUNT,
  type CustomFieldDef,
  type CustomFieldType,
} from "@/lib/types/customFields";

type DefRow = {
  id: string;
  user_id: string;
  label: string;
  field_type: string;
  sort_order: number;
  created_at: string;
};

function rowToDef(row: DefRow): CustomFieldDef {
  return {
    id: row.id,
    label: row.label.trim(),
    fieldType: row.field_type as CustomFieldType,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function fetchCustomFieldDefs(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: CustomFieldDef[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("contact_custom_field_defs")
    .select("id,user_id,label,field_type,sort_order,created_at")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }
  return { data: ((data ?? []) as DefRow[]).map(rowToDef), error: null };
}

export async function createCustomFieldDef(
  supabase: SupabaseClient,
  userId: string,
  input: { label: string; fieldType: CustomFieldType },
): Promise<{ data: CustomFieldDef | null; error: Error | null }> {
  const label = input.label.trim();
  if (!label) {
    return { data: null, error: new Error("Libellé requis.") };
  }

  const { data: existing, error: countErr } = await supabase
    .from("contact_custom_field_defs")
    .select("id,sort_order")
    .eq("user_id", userId);

  if (countErr) {
    return { data: null, error: new Error(countErr.message) };
  }
  const rows = existing ?? [];
  if (rows.length >= CUSTOM_FIELD_MAX_PER_ACCOUNT) {
    return {
      data: null,
      error: new Error(
        `Maximum ${CUSTOM_FIELD_MAX_PER_ACCOUNT} champs personnalisés.`,
      ),
    };
  }
  const maxSort = rows.reduce(
    (acc, r) => Math.max(acc, (r as { sort_order: number }).sort_order ?? 0),
    -1,
  );

  const { data, error } = await supabase
    .from("contact_custom_field_defs")
    .insert({
      user_id: userId,
      label,
      field_type: input.fieldType,
      sort_order: maxSort + 1,
    })
    .select("id,user_id,label,field_type,sort_order,created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        data: null,
        error: new Error("Un champ avec ce libellé existe déjà."),
      };
    }
    return { data: null, error: new Error(error.message) };
  }
  return { data: rowToDef(data as DefRow), error: null };
}

export async function updateCustomFieldDef(
  supabase: SupabaseClient,
  userId: string,
  fieldId: string,
  patch: { label?: string; sortOrder?: number },
): Promise<{ error: Error | null }> {
  const update: Record<string, unknown> = {};
  if (patch.label !== undefined) {
    const label = patch.label.trim();
    if (!label) {
      return { error: new Error("Libellé requis.") };
    }
    update.label = label;
  }
  if (patch.sortOrder !== undefined) {
    update.sort_order = patch.sortOrder;
  }
  if (Object.keys(update).length === 0) {
    return { error: null };
  }

  const { error } = await supabase
    .from("contact_custom_field_defs")
    .update(update)
    .eq("id", fieldId)
    .eq("user_id", userId);

  if (error) {
    if (error.code === "23505") {
      return { error: new Error("Un champ avec ce libellé existe déjà.") };
    }
    return { error: new Error(error.message) };
  }
  return { error: null };
}

/** Swap sort_order entre deux defs du même compte. */
export async function swapCustomFieldDefOrder(
  supabase: SupabaseClient,
  userId: string,
  aId: string,
  aSort: number,
  bId: string,
  bSort: number,
): Promise<{ error: Error | null }> {
  const { error: e1 } = await updateCustomFieldDef(supabase, userId, aId, {
    sortOrder: bSort,
  });
  if (e1) return { error: e1 };
  const { error: e2 } = await updateCustomFieldDef(supabase, userId, bId, {
    sortOrder: aSort,
  });
  return { error: e2 };
}

/**
 * Supprime la définition et retire la clé des `custom_fields` de tous les clients du compte.
 */
export async function deleteCustomFieldDef(
  supabase: SupabaseClient,
  userId: string,
  fieldId: string,
): Promise<{ error: Error | null }> {
  const { error: delErr } = await supabase
    .from("contact_custom_field_defs")
    .delete()
    .eq("id", fieldId)
    .eq("user_id", userId);

  if (delErr) {
    return { error: new Error(delErr.message) };
  }

  const { data: clients, error: fetchErr } = await supabase
    .from("clients")
    .select("id,custom_fields")
    .eq("user_id", userId);

  if (fetchErr) {
    return { error: new Error(fetchErr.message) };
  }

  for (const raw of clients ?? []) {
    const row = raw as { id: string; custom_fields: Record<string, unknown> | null };
    const cf = row.custom_fields ?? {};
    if (!(fieldId in cf)) continue;
    const next = { ...cf };
    delete next[fieldId];
    const { error: upErr } = await supabase
      .from("clients")
      .update({ custom_fields: next })
      .eq("id", row.id)
      .eq("user_id", userId);
    if (upErr) {
      return { error: new Error(upErr.message) };
    }
  }

  return { error: null };
}
