-- Agrégat couverture champs merge (wizard). Body uuid[] — pas de .in() GET.
-- Mode all : p_all_eligible, 0 destinataire sur le fil.

create or replace function public.campaign_merge_fill_counts(
  p_custom_ids text[] default '{}'::text[],
  p_all_eligible boolean default false,
  p_client_ids uuid[] default null,
  p_exclude_ids uuid[] default null
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

grant execute on function public.campaign_merge_fill_counts(text[], boolean, uuid[], uuid[])
  to authenticated;
