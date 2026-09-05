-- Bulk group members: 1 RPC au lieu de N inserts PostgREST + trigger COUNT par ligne.

create or replace function public.recalc_client_group_member_count(p_group_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.client_groups g
  set member_count = coalesce(
    (
      select count(*)::integer
      from public.client_group_members m
      join public.clients c on c.id = m.client_id
      where m.group_id = p_group_id
        and c.deleted_at is null
    ),
    0
  )
  where g.id = p_group_id;
$$;

create or replace function public.sync_client_group_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
begin
  if coalesce(current_setting('app.bulk_group_member_sync', true), '') = 'true' then
    return coalesce(new, old);
  end if;

  gid := coalesce(new.group_id, old.group_id);
  perform public.recalc_client_group_member_count(gid);
  return coalesce(new, old);
end;
$$;

create or replace function public.assert_own_client_group(p_group_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.client_groups g
    where g.id = p_group_id
      and g.user_id = auth.uid()
      and g.deleted_at is null
  ) then
    raise exception 'Groupe introuvable.';
  end if;
end;
$$;

create or replace function public.set_group_members(
  p_group_id uuid,
  p_client_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.assert_own_client_group(p_group_id);

  delete from public.client_group_members
  where group_id = p_group_id;

  if coalesce(array_length(p_client_ids, 1), 0) > 0 then
    perform set_config('app.bulk_group_member_sync', 'true', true);

    insert into public.client_group_members (client_id, group_id)
    select c.id, p_group_id
    from unnest(p_client_ids) as cid(id)
    inner join public.clients c on c.id = cid.id
    where c.user_id = v_user_id
      and c.deleted_at is null
    on conflict do nothing;

    perform set_config('app.bulk_group_member_sync', 'false', true);
  end if;

  perform public.recalc_client_group_member_count(p_group_id);
end;
$$;

create or replace function public.add_group_members(
  p_group_id uuid,
  p_client_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.assert_own_client_group(p_group_id);

  if coalesce(array_length(p_client_ids, 1), 0) = 0 then
    return;
  end if;

  perform set_config('app.bulk_group_member_sync', 'true', true);

  insert into public.client_group_members (client_id, group_id)
  select c.id, p_group_id
  from unnest(p_client_ids) as cid(id)
  inner join public.clients c on c.id = cid.id
  where c.user_id = v_user_id
    and c.deleted_at is null
  on conflict do nothing;

  perform set_config('app.bulk_group_member_sync', 'false', true);

  perform public.recalc_client_group_member_count(p_group_id);
end;
$$;

create or replace function public.create_client_group_with_members(
  p_name text,
  p_description text default '',
  p_client_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_group_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_name = '' then
    raise exception 'Le nom du groupe est obligatoire.';
  end if;

  insert into public.client_groups (user_id, name, description)
  values (v_user_id, v_name, btrim(coalesce(p_description, '')))
  returning id into v_group_id;

  if coalesce(array_length(p_client_ids, 1), 0) > 0 then
    perform set_config('app.bulk_group_member_sync', 'true', true);

    insert into public.client_group_members (client_id, group_id)
    select c.id, v_group_id
    from unnest(p_client_ids) as cid(id)
    inner join public.clients c on c.id = cid.id
    where c.user_id = v_user_id
      and c.deleted_at is null
    on conflict do nothing;

    perform set_config('app.bulk_group_member_sync', 'false', true);

    perform public.recalc_client_group_member_count(v_group_id);
  end if;

  return v_group_id;
exception
  when unique_violation then
    raise exception 'Un groupe avec ce nom existe déjà.' using errcode = '23505';
end;
$$;

grant execute on function public.set_group_members(uuid, uuid[]) to authenticated;
grant execute on function public.add_group_members(uuid, uuid[]) to authenticated;
grant execute on function public.create_client_group_with_members(text, text, uuid[]) to authenticated;

create or replace function public.list_group_member_ids(p_group_id uuid)
returns uuid[]
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    array_agg(m.client_id order by m.client_id),
    '{}'::uuid[]
  )
  from public.client_group_members m
  inner join public.clients c on c.id = m.client_id
  where m.group_id = p_group_id
    and c.user_id = auth.uid()
    and c.deleted_at is null
    and exists (
      select 1
      from public.client_groups g
      where g.id = p_group_id
        and g.user_id = auth.uid()
        and g.deleted_at is null
    );
$$;

grant execute on function public.list_group_member_ids(uuid) to authenticated;
