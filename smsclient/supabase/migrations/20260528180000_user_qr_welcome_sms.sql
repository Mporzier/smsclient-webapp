-- Option SMS de bienvenue après inscription via le formulaire QR.
alter table public.user_qr_codes
  add column if not exists welcome_sms_enabled boolean not null default false;
