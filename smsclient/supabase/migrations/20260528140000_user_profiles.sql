-- Profil compte : onboarding, entreprise, expéditeur SMS.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  company_name text not null default '',
  business_activity text not null default '',
  siret text not null default '',
  tva text not null default '',
  address text not null default '',
  zip text not null default '',
  city text not null default '',
  country text not null default 'France',
  billing_contact text not null default '',
  sms_sender text not null default '',
  notify_invoices boolean not null default true,
  notify_summary boolean not null default true,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "user_profiles_select_own"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "user_profiles_insert_own"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

create policy "user_profiles_update_own"
  on public.user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.touch_user_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.touch_user_profiles_updated_at();

create or replace function public.create_user_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_user_profile on auth.users;
create trigger on_auth_user_created_user_profile
  after insert on auth.users
  for each row execute function public.create_user_profile_for_new_user();

-- Comptes existants sans profil
insert into public.user_profiles (user_id)
select u.id from auth.users u
where not exists (
  select 1 from public.user_profiles p where p.user_id = u.id
);
