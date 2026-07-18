-- Favoris catalogue automatisations (ids JSON catalog).
create table if not exists public.sms_automation_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  automation_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, automation_id)
);

create index if not exists sms_automation_favorites_user_id_idx
  on public.sms_automation_favorites (user_id);

alter table public.sms_automation_favorites enable row level security;

create policy "sms_automation_favorites_select_own"
  on public.sms_automation_favorites for select
  using (auth.uid() = user_id);

create policy "sms_automation_favorites_insert_own"
  on public.sms_automation_favorites for insert
  with check (auth.uid() = user_id);

create policy "sms_automation_favorites_delete_own"
  on public.sms_automation_favorites for delete
  using (auth.uid() = user_id);
