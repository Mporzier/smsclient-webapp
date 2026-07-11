alter table public.sms_campaigns
  add column if not exists target_contacts jsonb,
  add column if not exists target_groups jsonb;
