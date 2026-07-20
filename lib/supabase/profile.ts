import { sanitizeSender } from "@/lib/proto/smsUtils";
import {
  isValidBusinessActivityId,
  normalizeBusinessActivityId,
} from "@/lib/types/businessActivity";
import {
  EMPTY_PROFILE_FORM,
  type UserProfile,
  type UserProfileForm,
} from "@/lib/types/profile";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UserProfileRecord = {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  language: string | null;
  company_name: string;
  business_activity: string;
  siret: string;
  tva: string;
  address: string;
  zip: string;
  city: string;
  country: string;
  billing_contact: string;
  sms_sender: string;
  notify_invoices: boolean;
  notify_summary: boolean;
  onboarding_completed_at: string | null;
};

function normalizeLanguage(raw: string | null | undefined): UserProfileForm["language"] {
  return raw === "en" ? "en" : "fr";
}

function recordToProfile(
  row: UserProfileRecord,
  email: string,
): UserProfile {
  return {
    userId: row.user_id,
    firstName: row.first_name?.trim() ?? "",
    lastName: row.last_name?.trim() ?? "",
    email,
    phone: row.phone?.trim() ?? "",
    language: normalizeLanguage(row.language),
    companyName: row.company_name?.trim() ?? "",
    businessActivity: (normalizeBusinessActivityId(
      row.business_activity?.trim() ?? "",
    ) ?? "") as UserProfile["businessActivity"],
    siret: row.siret?.trim() ?? "",
    tva: row.tva?.trim() ?? "",
    address: row.address?.trim() ?? "",
    zip: row.zip?.trim() ?? "",
    city: row.city?.trim() ?? "",
    country: row.country?.trim() || "France",
    billingContact: row.billing_contact?.trim() ?? "",
    sender: sanitizeSender(row.sms_sender ?? ""),
    notifyInvoices: row.notify_invoices,
    notifySummary: row.notify_summary,
    onboardingCompleted: Boolean(row.onboarding_completed_at),
  };
}

export function profileToForm(profile: UserProfile): UserProfileForm {
  const { userId, onboardingCompleted, ...form } = profile;
  void userId;
  void onboardingCompleted;
  return form;
}

function formToRow(form: UserProfileForm) {
  const rawActivity = form.businessActivity.trim();
  const activity = rawActivity
    ? normalizeBusinessActivityId(rawActivity)
    : "";
  if (rawActivity && !activity) {
    throw new Error("Activité invalide.");
  }
  if (activity && !isValidBusinessActivityId(activity)) {
    throw new Error("Activité invalide.");
  }
  return {
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    phone: form.phone.trim(),
    language: form.language === "en" ? "en" : "fr",
    company_name: form.companyName.trim(),
    business_activity: activity || "",
    siret: form.siret.trim(),
    tva: form.tva.trim(),
    address: form.address.trim(),
    zip: form.zip.trim(),
    city: form.city.trim(),
    country: form.country.trim() || "France",
    billing_contact: form.billingContact.trim(),
    sms_sender: sanitizeSender(form.sender),
    notify_invoices: form.notifyInvoices,
    notify_summary: form.notifySummary,
  };
}

export async function getOrCreateUserProfile(
  supabase: SupabaseClient,
  userId: string,
  email: string,
): Promise<{ data: UserProfile | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  if (data) {
    return {
      data: recordToProfile(data as UserProfileRecord, email),
      error: null,
    };
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("user_profiles")
    .insert({ user_id: userId })
    .select("*")
    .single();

  if (insertErr) {
    return { data: null, error: new Error(insertErr.message) };
  }

  return {
    data: recordToProfile(inserted as UserProfileRecord, email),
    error: null,
  };
}

export async function updateUserProfile(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  form: UserProfileForm,
): Promise<{ data: UserProfile | null; error: Error | null }> {
  const patch = formToRow(form);
  const { data, error } = await supabase
    .from("user_profiles")
    .update(patch)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return {
    data: recordToProfile(data as UserProfileRecord, email),
    error: null,
  };
}

export async function completeUserOnboarding(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  form: UserProfileForm,
): Promise<{ data: UserProfile | null; error: Error | null }> {
  const patch = {
    ...formToRow(form),
    onboarding_completed_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("user_profiles")
    .update(patch)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return {
    data: recordToProfile(data as UserProfileRecord, email),
    error: null,
  };
}

export function defaultProfileForm(email: string): UserProfileForm {
  return { ...EMPTY_PROFILE_FORM, email };
}
