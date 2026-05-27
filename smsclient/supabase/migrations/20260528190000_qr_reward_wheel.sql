-- Roue des récompenses (formulaire QR).

alter table public.user_qr_codes
  add column if not exists wheel_enabled boolean not null default false,
  add column if not exists wheel_title text not null default 'Tournez la roue !',
  add column if not exists wheel_subtitle text not null default 'Tentez votre chance après inscription',
  add column if not exists wheel_allow_repeat boolean not null default false,
  add column if not exists wheel_prize_validity_days int not null default 30
    check (wheel_prize_validity_days >= 1 and wheel_prize_validity_days <= 365),
  add column if not exists wheel_send_prize_sms boolean not null default true;

create table if not exists public.qr_wheel_segments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sort_order int not null default 0,
  label text not null,
  probability_weight int not null default 1 check (probability_weight > 0),
  is_losing boolean not null default false,
  screen_message text not null default '',
  sms_message text not null default '',
  color text not null default '#4a86ff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists qr_wheel_segments_user_id_idx
  on public.qr_wheel_segments (user_id, sort_order);

alter table public.qr_wheel_segments enable row level security;

create policy "qr_wheel_segments_select_own"
  on public.qr_wheel_segments for select
  using (auth.uid() = user_id);

create policy "qr_wheel_segments_insert_own"
  on public.qr_wheel_segments for insert
  with check (auth.uid() = user_id);

create policy "qr_wheel_segments_update_own"
  on public.qr_wheel_segments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "qr_wheel_segments_delete_own"
  on public.qr_wheel_segments for delete
  using (auth.uid() = user_id);

create table if not exists public.qr_wheel_spins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  segment_id uuid references public.qr_wheel_segments (id) on delete set null,
  phone_e164 text not null,
  prize_label text not null,
  prize_message text not null default '',
  valid_until date,
  sms_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists qr_wheel_spins_user_phone_idx
  on public.qr_wheel_spins (user_id, phone_e164, created_at desc);

create index if not exists qr_wheel_spins_client_id_idx
  on public.qr_wheel_spins (client_id);

alter table public.qr_wheel_spins enable row level security;

create policy "qr_wheel_spins_select_own"
  on public.qr_wheel_spins for select
  using (auth.uid() = user_id);

-- Config publique + segments (sans poids) pour le formulaire capture.
create or replace function public.get_qr_public_config(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_qr public.user_qr_codes%rowtype;
  v_segments jsonb;
begin
  select * into v_qr
  from public.user_qr_codes q
  where q.slug = p_slug and q.is_active = true
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_slug');
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'label', s.label,
        'color', s.color,
        'is_losing', s.is_losing
      )
      order by s.sort_order, s.created_at
    ),
    '[]'::jsonb
  )
  into v_segments
  from public.qr_wheel_segments s
  where s.user_id = v_qr.user_id;

  return jsonb_build_object(
    'ok', true,
    'public_label', v_qr.public_label,
    'wheel', jsonb_build_object(
      'enabled', v_qr.wheel_enabled and jsonb_array_length(v_segments) > 0,
      'title', v_qr.wheel_title,
      'subtitle', v_qr.wheel_subtitle,
      'segments', v_segments
    )
  );
end;
$$;

grant execute on function public.get_qr_public_config(text) to anon, authenticated;

-- Tirage pondéré côté serveur.
create or replace function public.spin_qr_wheel(
  p_slug text,
  p_phone_e164 text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qr public.user_qr_codes%rowtype;
  v_client public.clients%rowtype;
  v_segment public.qr_wheel_segments%rowtype;
  v_total int;
  v_pick int;
  v_running int;
  v_valid_until date;
  v_note_line text;
  v_existing_spin uuid;
begin
  select * into v_qr
  from public.user_qr_codes q
  where q.slug = p_slug and q.is_active = true
  limit 1;

  if not found or not v_qr.wheel_enabled then
    return jsonb_build_object('ok', false, 'error', 'wheel_disabled');
  end if;

  select * into v_client
  from public.clients c
  where c.user_id = v_qr.user_id and c.phone_e164 = p_phone_e164
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'client_not_found');
  end if;

  if not v_client.opt_in or v_client.stop_sms then
    return jsonb_build_object('ok', false, 'error', 'opt_in_required');
  end if;

  if not v_qr.wheel_allow_repeat then
    select s.id into v_existing_spin
    from public.qr_wheel_spins s
    where s.user_id = v_qr.user_id and s.phone_e164 = p_phone_e164
    limit 1;
    if v_existing_spin is not null then
      return jsonb_build_object('ok', false, 'error', 'already_spun');
    end if;
  end if;

  select coalesce(sum(probability_weight), 0)::int into v_total
  from public.qr_wheel_segments
  where user_id = v_qr.user_id;

  if v_total <= 0 then
    return jsonb_build_object('ok', false, 'error', 'no_segments');
  end if;

  v_pick := floor(random() * v_total)::int + 1;
  v_running := 0;

  for v_segment in
    select * from public.qr_wheel_segments
    where user_id = v_qr.user_id
    order by sort_order, created_at
  loop
    v_running := v_running + v_segment.probability_weight;
    if v_pick <= v_running then
      exit;
    end if;
  end loop;

  if v_segment.id is null then
    return jsonb_build_object('ok', false, 'error', 'no_segments');
  end if;

  v_valid_until := current_date + v_qr.wheel_prize_validity_days;

  insert into public.qr_wheel_spins (
    user_id,
    client_id,
    segment_id,
    phone_e164,
    prize_label,
    prize_message,
    valid_until
  ) values (
    v_qr.user_id,
    v_client.id,
    v_segment.id,
    p_phone_e164,
    v_segment.label,
    coalesce(nullif(trim(v_segment.screen_message), ''), v_segment.label),
    case when v_segment.is_losing then null else v_valid_until end
  );

  v_note_line := '[Roue ' || to_char(now() at time zone 'Europe/Paris', 'DD/MM/YYYY')
    || '] ' || v_segment.label;
  if not v_segment.is_losing then
    v_note_line := v_note_line || ' (valable jusqu''au '
      || to_char(v_valid_until, 'DD/MM/YYYY') || ')';
  end if;

  update public.clients
  set notes = case
    when coalesce(trim(notes), '') = '' then v_note_line
    else trim(notes) || E'\n' || v_note_line
  end
  where id = v_client.id;

  return jsonb_build_object(
    'ok', true,
    'segment_id', v_segment.id,
    'label', v_segment.label,
    'screen_message', coalesce(nullif(trim(v_segment.screen_message), ''), v_segment.label),
    'sms_message', v_segment.sms_message,
    'is_losing', v_segment.is_losing,
    'valid_until', case when v_segment.is_losing then null else v_valid_until end,
    'send_prize_sms', v_qr.wheel_send_prize_sms and not v_segment.is_losing
  );
end;
$$;

grant execute on function public.spin_qr_wheel(text, text) to anon, authenticated;

-- submit_qr_lead : retourne client_id pour enchaîner la roue.
drop function if exists public.submit_qr_lead(text, text, text, text, boolean, date);

create or replace function public.submit_qr_lead(
  p_slug text,
  p_first_name text,
  p_last_name text,
  p_phone_e164 text,
  p_opt_in boolean default true,
  p_birthday date default null
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
  v_opt_in boolean;
  v_stop_sms boolean;
  v_client_id uuid;
begin
  select q.user_id into v_user_id
  from public.user_qr_codes q
  where q.slug = p_slug and q.is_active = true
  limit 1;

  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_slug');
  end if;

  v_first := btrim(coalesce(p_first_name, ''));
  v_last := btrim(coalesce(p_last_name, ''));
  v_opt_in := coalesce(p_opt_in, true);
  v_stop_sms := not v_opt_in;

  if v_first = '' then
    return jsonb_build_object('ok', false, 'error', 'first_name_required');
  end if;

  if p_phone_e164 !~ '^\+33[67][0-9]{8}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_phone');
  end if;

  select c.id into v_client_id
  from public.clients c
  where c.user_id = v_user_id
    and c.phone_e164 = p_phone_e164
    and c.deleted_at is null
  limit 1;

  if v_client_id is not null then
    update public.clients
    set
      first_name = v_first,
      last_name = v_last,
      stop_sms = public.clients.stop_sms or v_stop_sms,
      opt_in = case
        when (public.clients.stop_sms or v_stop_sms) then false
        else (public.clients.opt_in or v_opt_in)
      end,
      source = 'QR boutique',
      birthday = coalesce(p_birthday, public.clients.birthday)
    where id = v_client_id;
  else
    update public.clients
    set
      deleted_at = null,
      first_name = v_first,
      last_name = v_last,
      stop_sms = public.clients.stop_sms or v_stop_sms,
      opt_in = case
        when (public.clients.stop_sms or v_stop_sms) then false
        else (public.clients.opt_in or v_opt_in)
      end,
      source = 'QR boutique',
      birthday = coalesce(p_birthday, public.clients.birthday),
      group_label = 'Non classé'
    where user_id = v_user_id
      and phone_e164 = p_phone_e164
      and deleted_at is not null
    returning id into v_client_id;

    if v_client_id is null then
      insert into public.clients (
        user_id, first_name, last_name, phone_e164, group_label, source,
        opt_in, stop_sms, notes, birthday
      ) values (
        v_user_id, v_first, v_last, p_phone_e164, 'Non classé', 'QR boutique',
        v_opt_in, v_stop_sms, '', p_birthday
      )
      returning id into v_client_id;
    end if;
  end if;

  return jsonb_build_object('ok', true, 'client_id', v_client_id);
end;
$$;

grant execute on function public.submit_qr_lead(text, text, text, text, boolean, date)
  to anon, authenticated;
