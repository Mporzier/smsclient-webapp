-- Table des contacts clients (un compte = auth.users, RLS par user_id).
-- À exécuter dans Supabase : SQL Editor → New query → coller → Run.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null default '',
  phone_e164 text not null,
  group_label text not null default 'Non classé',
  source text not null default 'Ajout manuel',
  opt_in boolean not null default true,
  stop_sms boolean not null default false,
  last_sms_sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint clients_user_phone unique (user_id, phone_e164)
);

create index if not exists clients_user_id_created_idx
  on public.clients (user_id, created_at desc);

alter table public.clients enable row level security;

create policy "clients_select_own"
  on public.clients for select
  using (auth.uid() = user_id);

create policy "clients_insert_own"
  on public.clients for insert
  with check (auth.uid() = user_id);

create policy "clients_update_own"
  on public.clients for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "clients_delete_own"
  on public.clients for delete
  using (auth.uid() = user_id);
