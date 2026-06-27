-- Mode post-inscription exclusif : SMS de bienvenue OU roue, jamais les deux.

-- Corrige les lignes existantes (priorité à la roue si les deux étaient actifs).
update public.user_qr_codes
set welcome_sms_enabled = false
where welcome_sms_enabled and wheel_enabled;

alter table public.user_qr_codes
  drop constraint if exists qr_capture_mode_exclusive;

alter table public.user_qr_codes
  add constraint qr_capture_mode_exclusive
  check (not (welcome_sms_enabled and wheel_enabled));

create or replace function public.enforce_qr_capture_exclusive_mode()
returns trigger
language plpgsql
as $$
begin
  if NEW.welcome_sms_enabled and NEW.wheel_enabled then
    if TG_OP = 'UPDATE' then
      if OLD.welcome_sms_enabled is distinct from NEW.welcome_sms_enabled
         and NEW.welcome_sms_enabled then
        NEW.wheel_enabled := false;
      elsif OLD.wheel_enabled is distinct from NEW.wheel_enabled
         and NEW.wheel_enabled then
        NEW.welcome_sms_enabled := false;
      else
        NEW.welcome_sms_enabled := false;
      end if;
    else
      NEW.welcome_sms_enabled := false;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_user_qr_codes_exclusive_mode on public.user_qr_codes;

create trigger trg_user_qr_codes_exclusive_mode
  before insert or update on public.user_qr_codes
  for each row
  execute function public.enforce_qr_capture_exclusive_mode();

create or replace function public.set_qr_capture_mode(p_mode text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.user_qr_codes%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if p_mode not in ('welcome', 'wheel', 'none') then
    return jsonb_build_object('ok', false, 'error', 'invalid_mode');
  end if;

  update public.user_qr_codes
  set
    welcome_sms_enabled = (p_mode = 'welcome'),
    wheel_enabled = (p_mode = 'wheel'),
    updated_at = now()
  where user_id = v_user_id
  returning * into v_row;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'qr_not_found');
  end if;

  return jsonb_build_object(
    'ok', true,
    'mode', p_mode,
    'welcome_sms_enabled', v_row.welcome_sms_enabled,
    'wheel_enabled', v_row.wheel_enabled
  );
end;
$$;

grant execute on function public.set_qr_capture_mode(text) to authenticated;

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
  v_qr public.user_qr_codes%rowtype;
  v_first text;
  v_last text;
  v_opt_in boolean;
  v_stop_sms boolean;
  v_client_id uuid;
  v_send_welcome boolean := false;
begin
  select * into v_qr
  from public.user_qr_codes q
  where q.slug = p_slug and q.is_active = true
  limit 1;

  if not found then
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
  where c.user_id = v_qr.user_id
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
    where user_id = v_qr.user_id
      and phone_e164 = p_phone_e164
      and deleted_at is not null
    returning id into v_client_id;

    if v_client_id is null then
      insert into public.clients (
        user_id, first_name, last_name, phone_e164, group_label, source,
        opt_in, stop_sms, notes, birthday
      ) values (
        v_qr.user_id, v_first, v_last, p_phone_e164, 'Non classé', 'QR boutique',
        v_opt_in, v_stop_sms, '', p_birthday
      )
      returning id into v_client_id;
    end if;
  end if;

  v_send_welcome := v_qr.welcome_sms_enabled
    and v_opt_in
    and not v_stop_sms;

  return jsonb_build_object(
    'ok', true,
    'client_id', v_client_id,
    'send_welcome_sms', v_send_welcome,
    'welcome_sms_template', case when v_send_welcome then v_qr.welcome_sms_template else null end
  );
end;
$$;

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
  v_send_prize_sms boolean := false;
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

  v_send_prize_sms := v_qr.wheel_send_prize_sms and not v_segment.is_losing;

  return jsonb_build_object(
    'ok', true,
    'segment_id', v_segment.id,
    'label', v_segment.label,
    'screen_message', coalesce(nullif(trim(v_segment.screen_message), ''), v_segment.label),
    'sms_message', v_segment.sms_message,
    'is_losing', v_segment.is_losing,
    'valid_until', case when v_segment.is_losing then null else v_valid_until end,
    'send_prize_sms', v_send_prize_sms
  );
end;
$$;
