-- Modèles SMS personnalisés par utilisateur.

create table if not exists public.user_sms_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  body text not null,
  created_at timestamptz not null default now(),
  constraint user_sms_templates_title_len check (char_length(trim(title)) >= 3),
  constraint user_sms_templates_body_len check (char_length(trim(body)) >= 1)
);

create index if not exists user_sms_templates_user_created_idx
  on public.user_sms_templates (user_id, created_at desc);

alter table public.user_sms_templates enable row level security;

create policy "user_sms_templates_select_own"
  on public.user_sms_templates for select
  using (auth.uid() = user_id);

create policy "user_sms_templates_insert_own"
  on public.user_sms_templates for insert
  with check (auth.uid() = user_id);

create policy "user_sms_templates_update_own"
  on public.user_sms_templates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_sms_templates_delete_own"
  on public.user_sms_templates for delete
  using (auth.uid() = user_id);
