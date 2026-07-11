-- SMS automatiques (anniversaires, événements calendaires).
create table if not exists public.sms_automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  preset_key text not null,
  kind text not null check (kind in ('birthday', 'fixed_date')),
  name text not null,
  body text not null default '',
  enabled boolean not null default false,
  send_time time not null default '09:00',
  fixed_month smallint check (fixed_month is null or (fixed_month >= 1 and fixed_month <= 12)),
  fixed_day smallint check (fixed_day is null or (fixed_day >= 1 and fixed_day <= 31)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sms_automations_user_preset unique (user_id, preset_key)
);

create index if not exists sms_automations_user_id_idx
  on public.sms_automations (user_id);

alter table public.sms_automations enable row level security;

create policy "sms_automations_select_own"
  on public.sms_automations for select
  using (auth.uid() = user_id);

create policy "sms_automations_insert_own"
  on public.sms_automations for insert
  with check (auth.uid() = user_id);

create policy "sms_automations_update_own"
  on public.sms_automations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sms_automations_delete_own"
  on public.sms_automations for delete
  using (auth.uid() = user_id);
