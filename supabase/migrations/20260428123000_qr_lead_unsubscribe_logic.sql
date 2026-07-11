-- Corrige la capture QR: si opt-in refusé, le contact est enregistré désabonné.

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
  v_opt_in boolean;
  v_stop_sms boolean;
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
  v_opt_in := coalesce(p_opt_in, true);
  v_stop_sms := not v_opt_in;

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
    v_opt_in,
    v_stop_sms,
    ''
  )
  on conflict (user_id, phone_e164)
  do update set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    stop_sms = public.clients.stop_sms or excluded.stop_sms,
    opt_in = case
      when (public.clients.stop_sms or excluded.stop_sms) then false
      else (public.clients.opt_in or excluded.opt_in)
    end,
    source = 'QR boutique';

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.submit_qr_lead(text, text, text, text, boolean) to anon, authenticated;
