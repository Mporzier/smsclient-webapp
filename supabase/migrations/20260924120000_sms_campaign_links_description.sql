-- Description optionnelle (liste + modale), comme groupes.

alter table public.sms_campaign_links
  add column if not exists description text not null default '';

create or replace function public.create_sms_short_link(
  p_original_url text,
  p_campaign_id uuid default null,
  p_label text default '',
  p_icon text default 'link',
  p_description text default ''
)
returns table (
  id uuid,
  short_code text,
  short_url text,
  original_url text,
  click_count int,
  created_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_url text;
  v_code text;
  v_row public.sms_campaign_links%rowtype;
  v_base text := 'https://l.sms.fm';
  v_attempt int := 0;
  v_icon text := coalesce(nullif(trim(p_icon), ''), 'link');
  v_description text := coalesce(trim(p_description), '');
begin
  if v_user_id is null then
    raise exception 'Non authentifié';
  end if;

  v_url := trim(coalesce(p_original_url, ''));
  if v_url = '' then
    raise exception 'URL requise';
  end if;
  if v_url !~* '^https?://' then
    v_url := 'https://' || v_url;
  end if;

  select * into v_row
  from public.sms_campaign_links l
  where l.user_id = v_user_id and l.original_url = v_url;

  if found then
    update public.sms_campaign_links scl
    set
      campaign_id = coalesce(p_campaign_id, scl.campaign_id),
      label = coalesce(nullif(trim(p_label), ''), scl.label),
      icon = v_icon,
      description = v_description
    where scl.id = v_row.id
    returning * into v_row;

    return query
    select
      v_row.id,
      v_row.short_code,
      v_base || '/' || v_row.short_code,
      v_row.original_url,
      v_row.click_count,
      v_row.created_at;
    return;
  end if;

  loop
    v_attempt := v_attempt + 1;
    if v_attempt > 20 then
      raise exception 'Impossible de générer un code court unique';
    end if;
    v_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 7);
    exit when not exists (
      select 1
      from public.sms_campaign_links scl
      where scl.short_code = v_code
    );
  end loop;

  insert into public.sms_campaign_links (
    user_id,
    campaign_id,
    label,
    original_url,
    short_code,
    icon,
    description
  )
  values (
    v_user_id,
    p_campaign_id,
    coalesce(nullif(trim(p_label), ''), ''),
    v_url,
    v_code,
    v_icon,
    v_description
  )
  returning * into v_row;

  return query
  select
    v_row.id,
    v_row.short_code,
    v_base || '/' || v_row.short_code,
    v_row.original_url,
    v_row.click_count,
    v_row.created_at;
end;
$$;

grant execute on function public.create_sms_short_link(text, uuid, text, text, text) to authenticated;
