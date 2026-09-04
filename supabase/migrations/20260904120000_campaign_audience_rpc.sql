-- Audience campagne côté SQL : ids + rows + merge fill search (évite N× pages PostgREST).

create or replace function public.escape_ilike_pattern(p_raw text)
returns text
language sql
immutable
as $$
  select replace(
    replace(
      replace(coalesce(p_raw, ''), '\', '\\'),
      '%', '\%'
    ),
    '_', '\_'
  );
$$;

create or replace function public.client_matches_list_search(
  p_first_name text,
  p_last_name text,
  p_phone_e164 text,
  p_group_label text,
  p_search text
)
returns boolean
language sql
immutable
as $$
  select
    coalesce(trim(p_search), '') = ''
    or coalesce(p_first_name, '') ilike (
      '%' || public.escape_ilike_pattern(trim(p_search)) || '%'
    ) escape '\'
    or coalesce(p_last_name, '') ilike (
      '%' || public.escape_ilike_pattern(trim(p_search)) || '%'
    ) escape '\'
    or coalesce(p_phone_e164, '') ilike (
      '%' || public.escape_ilike_pattern(trim(p_search)) || '%'
    ) escape '\'
    or coalesce(p_group_label, '') ilike (
      '%' || public.escape_ilike_pattern(trim(p_search)) || '%'
    ) escape '\';
$$;

create or replace function public.list_client_ids(
  p_search text default '',
  p_eligible_only boolean default true
)
returns uuid[]
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    array_agg(c.id order by c.id),
    '{}'::uuid[]
  )
  from public.clients c
  where c.user_id = auth.uid()
    and c.deleted_at is null
    and (
      not p_eligible_only
      or (c.opt_in = true and c.stop_sms = false)
    )
    and public.client_matches_list_search(
      c.first_name,
      c.last_name,
      c.phone_e164,
      c.group_label,
      p_search
    );
$$;

grant execute on function public.list_client_ids(text, boolean) to authenticated;

create or replace function public.fetch_clients_for_campaign(
  p_search text default '',
  p_eligible_only boolean default true,
  p_client_ids uuid[] default null,
  p_all_eligible boolean default false,
  p_exclude_ids uuid[] default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'created_at', c.created_at,
        'first_name', c.first_name,
        'last_name', c.last_name,
        'phone_e164', c.phone_e164,
        'group_label', c.group_label,
        'notes', coalesce(c.notes, ''),
        'birthday', c.birthday,
        'custom_fields', coalesce(c.custom_fields, '{}'::jsonb),
        'last_sms_sent_at', c.last_sms_sent_at,
        'last_sms_body', c.last_sms_body,
        'unsubscribed_at', c.unsubscribed_at,
        'source', c.source,
        'opt_in', c.opt_in,
        'stop_sms', c.stop_sms,
        'groups', coalesce(
          (
            select jsonb_agg(cg.name order by cg.name)
            from public.client_group_members cgm
            inner join public.client_groups cg on cg.id = cgm.group_id
            where cgm.client_id = c.id
              and cg.user_id = auth.uid()
              and cg.deleted_at is null
          ),
          '[]'::jsonb
        )
      )
      order by c.id
    ),
    '[]'::jsonb
  )
  from public.clients c
  where c.user_id = auth.uid()
    and c.deleted_at is null
    and (
      (
        p_all_eligible
        and (not p_eligible_only or (c.opt_in = true and c.stop_sms = false))
        and public.client_matches_list_search(
          c.first_name,
          c.last_name,
          c.phone_e164,
          c.group_label,
          p_search
        )
        and (
          p_exclude_ids is null
          or cardinality(p_exclude_ids) = 0
          or not (c.id = any (p_exclude_ids))
        )
      )
      or (
        not p_all_eligible
        and p_client_ids is not null
        and cardinality(p_client_ids) > 0
        and c.id = any (p_client_ids)
      )
    );
$$;

grant execute on function public.fetch_clients_for_campaign(text, boolean, uuid[], boolean, uuid[]) to authenticated;

-- Étend merge fill : filtre search en mode « tous éligibles ».
create or replace function public.campaign_merge_fill_counts(
  p_custom_ids text[] default '{}'::text[],
  p_all_eligible boolean default false,
  p_client_ids uuid[] default null,
  p_exclude_ids uuid[] default null,
  p_search text default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  result jsonb;
begin
  if not p_all_eligible and (p_client_ids is null or cardinality(p_client_ids) = 0) then
    return jsonb_build_object(
      'total', 0,
      'prenom', 0,
      'nom', 0,
      'anniversaire', 0,
      'custom', '{}'::jsonb
    );
  end if;

  with audience as (
    select
      c.first_name,
      c.last_name,
      c.birthday,
      c.custom_fields
    from public.clients c
    where c.user_id = auth.uid()
      and c.deleted_at is null
      and (
        (
          p_all_eligible
          and c.opt_in = true
          and c.stop_sms = false
          and public.client_matches_list_search(
            c.first_name,
            c.last_name,
            c.phone_e164,
            c.group_label,
            coalesce(p_search, '')
          )
          and (
            p_exclude_ids is null
            or cardinality(p_exclude_ids) = 0
            or not (c.id = any (p_exclude_ids))
          )
        )
        or (
          not p_all_eligible
          and p_client_ids is not null
          and c.id = any (p_client_ids)
        )
      )
  ),
  totals as (
    select
      count(*)::int as total,
      count(*) filter (
        where length(trim(coalesce(first_name, ''))) > 0
      )::int as prenom,
      count(*) filter (
        where length(trim(coalesce(last_name, ''))) > 0
      )::int as nom,
      count(*) filter (where birthday is not null)::int as anniversaire
    from audience
  ),
  custom_filled as (
    select
      fid,
      count(*) filter (
        where length(trim(coalesce(a.custom_fields ->> fid, ''))) > 0
      )::int as filled
    from audience a
    cross join unnest(coalesce(p_custom_ids, '{}'::text[])) as fid
    group by fid
  )
  select jsonb_build_object(
    'total', totals.total,
    'prenom', totals.prenom,
    'nom', totals.nom,
    'anniversaire', totals.anniversaire,
    'custom', coalesce(
      (select jsonb_object_agg(cf.fid, cf.filled) from custom_filled cf),
      '{}'::jsonb
    )
  )
  into result
  from totals;

  return result;
end;
$$;

grant execute on function public.campaign_merge_fill_counts(text[], boolean, uuid[], uuid[], text)
  to authenticated;
