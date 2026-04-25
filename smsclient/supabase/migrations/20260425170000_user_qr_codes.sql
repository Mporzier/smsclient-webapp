-- QR code public par compte utilisateur (acquisition contacts en boutique).

create table if not exists public.user_qr_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null unique,
  public_label text not null default 'Formulaire client',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_qr_codes_user_unique unique (user_id)
);

create index if not exists user_qr_codes_user_id_idx
  on public.user_qr_codes (user_id);

alter table public.user_qr_codes enable row level security;

create policy "user_qr_codes_select_own"
  on public.user_qr_codes for select
  using (auth.uid() = user_id);

create policy "user_qr_codes_insert_own"
  on public.user_qr_codes for insert
  with check (auth.uid() = user_id);

create policy "user_qr_codes_update_own"
  on public.user_qr_codes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_qr_codes_delete_own"
  on public.user_qr_codes for delete
  using (auth.uid() = user_id);

create or replace function public.resolve_qr_slug(p_slug text)
returns table (
  slug text,
  public_label text,
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select q.slug, q.public_label, q.is_active
  from public.user_qr_codes q
  where q.slug = p_slug
  limit 1;
end;
$$;

create or replace function public.submit_qr_lead(
  p_slug text,
  p_first_name text,
  p_last_name text,
  p_phone_e164 text,
  p_opt_in boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_first text;
  v_last text;
begin
  select q.user_id
  into v_user_id
  from public.user_qr_codes q
  where q.slug = p_slug
    and q.is_active = true
  limit 1;

  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_slug');
  end if;

  v_first := btrim(coalesce(p_first_name, ''));
  v_last := btrim(coalesce(p_last_name, ''));

  if v_first = '' then
    return jsonb_build_object('ok', false, 'error', 'first_name_required');
  end if;

  if p_phone_e164 !~ '^\+33[67][0-9]{8}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_phone');
  end if;

  insert into public.clients (
    user_id,
    first_name,
    last_name,
    phone_e164,
    group_label,
    source,
    opt_in,
    stop_sms,
    notes
  ) values (
    v_user_id,
    v_first,
    v_last,
    p_phone_e164,
    'Non classé',
    'QR boutique',
    coalesce(p_opt_in, true),
    false,
    ''
  )
  on conflict (user_id, phone_e164)
  do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    opt_in = public.clients.opt_in or excluded.opt_in,
    source = 'QR boutique';

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.resolve_qr_slug(text) to anon, authenticated;
grant execute on function public.submit_qr_lead(text, text, text, text, boolean) to anon, authenticated;
