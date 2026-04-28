-- Compte de crédits SMS + historique d'achats (dummy checkout sans Stripe).
-- Exécuter dans Supabase SQL Editor.

create table if not exists public.sms_credits_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance int not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sms_credit_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pack_code text not null,
  pack_label text not null,
  credits int not null check (credits > 0),
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'EUR',
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  invoice_ref text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists sms_credit_purchases_user_id_created_idx
  on public.sms_credit_purchases (user_id, created_at desc);

alter table public.sms_credits_accounts enable row level security;
alter table public.sms_credit_purchases enable row level security;

create policy "sms_credits_accounts_select_own"
  on public.sms_credits_accounts for select
  using (auth.uid() = user_id);

create policy "sms_credits_accounts_insert_own"
  on public.sms_credits_accounts for insert
  with check (auth.uid() = user_id);

create policy "sms_credits_accounts_update_own"
  on public.sms_credits_accounts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sms_credit_purchases_select_own"
  on public.sms_credit_purchases for select
  using (auth.uid() = user_id);

create policy "sms_credit_purchases_insert_own"
  on public.sms_credit_purchases for insert
  with check (auth.uid() = user_id);

create or replace function public.touch_sms_credits_accounts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sms_credits_accounts_updated_at on public.sms_credits_accounts;
create trigger trg_sms_credits_accounts_updated_at
  before update on public.sms_credits_accounts
  for each row execute function public.touch_sms_credits_accounts_updated_at();

create or replace function public.create_sms_credits_account_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.sms_credits_accounts (user_id, balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_sms_credits on auth.users;
create trigger on_auth_user_created_sms_credits
  after insert on auth.users
  for each row execute function public.create_sms_credits_account_for_new_user();

-- Backfill comptes existants (idempotent).
insert into public.sms_credits_accounts (user_id, balance)
select u.id, 0
from auth.users u
on conflict (user_id) do nothing;
