-- Corrige submit_qr_lead : après soft delete, l'unicité est sur un index partiel
-- (deleted_at is null), donc ON CONFLICT (user_id, phone_e164) échoue (42P10).

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
