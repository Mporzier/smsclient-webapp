-- Parrainage : code unique par compte + filleuls inscrits.

create table if not exists public.user_referral_codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  constraint user_referral_codes_code_unique unique (code),
  constraint user_referral_codes_code_format check (code ~ '^[A-Z0-9]{8}$')
);

create table if not exists public.referral_signups (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users (id) on delete cascade,
  referred_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint referral_signups_referred_unique unique (referred_user_id),
  constraint referral_signups_no_self check (referrer_user_id <> referred_user_id)
);

create index if not exists referral_signups_referrer_idx
  on public.referral_signups (referrer_user_id);

alter table public.user_referral_codes enable row level security;
alter table public.referral_signups enable row level security;

create policy "user_referral_codes_select_own"
  on public.user_referral_codes for select
  using (auth.uid() = user_id);

create policy "referral_signups_select_as_referrer"
  on public.referral_signups for select
  using (auth.uid() = referrer_user_id);

create or replace function public.ensure_user_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_existing text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select code into v_existing
  from public.user_referral_codes
  where user_id = v_uid;

  if found then
    return v_existing;
  end if;

  for i in 1..20 loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      insert into public.user_referral_codes (user_id, code)
      values (v_uid, v_code);
      return v_code;
    exception
      when unique_violation then
        null;
    end;
  end loop;

  raise exception 'could not allocate referral code';
end;
$$;

create or replace function public.count_my_referrals()
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)::bigint
  from public.referral_signups
  where referrer_user_id = auth.uid();
$$;

grant execute on function public.ensure_user_referral_code() to authenticated;
grant execute on function public.count_my_referrals() to authenticated;

create or replace function public.process_referral_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref_code text;
  v_referrer uuid;
begin
  v_ref_code := upper(trim(coalesce(new.raw_user_meta_data->>'referral_code', '')));
  if v_ref_code = '' then
    return new;
  end if;

  select user_id into v_referrer
  from public.user_referral_codes
  where code = v_ref_code;

  if not found or v_referrer = new.id then
    return new;
  end if;

  insert into public.referral_signups (referrer_user_id, referred_user_id)
  values (v_referrer, new.id)
  on conflict (referred_user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_referral on auth.users;
create trigger on_auth_user_created_referral
  after insert on auth.users
  for each row execute function public.process_referral_on_signup();
