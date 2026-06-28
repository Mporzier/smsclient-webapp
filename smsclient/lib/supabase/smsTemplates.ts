import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserSmsTemplateRow } from "@/lib/types/smsTemplate";

export type UserSmsTemplateRecord = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  body: string;
  created_at: string;
};

function formatFrDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function recordToRow(r: UserSmsTemplateRecord): UserSmsTemplateRow {
  return {
    id: r.id,
    title: r.title.trim(),
    description: r.description.trim(),
    body: r.body,
    createdLabel: formatFrDate(r.created_at),
  };
}

export async function fetchUserSmsTemplates(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: UserSmsTemplateRow[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_sms_templates")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return {
    data: (data as UserSmsTemplateRecord[]).map(recordToRow),
    error: null,
  };
}

export async function createUserSmsTemplate(
  supabase: SupabaseClient,
  userId: string,
  args: { title: string; description?: string; body: string },
): Promise<{ data: UserSmsTemplateRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_sms_templates")
    .insert({
      user_id: userId,
      title: args.title.trim(),
      description: args.description?.trim() ?? "",
      body: args.body.trim(),
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: recordToRow(data as UserSmsTemplateRecord), error: null };
}

export async function deleteUserSmsTemplate(
  supabase: SupabaseClient,
  userId: string,
  templateId: string,
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("user_sms_templates")
    .delete()
    .eq("user_id", userId)
    .eq("id", templateId);

  return { error: error ? new Error(error.message) : null };
}
