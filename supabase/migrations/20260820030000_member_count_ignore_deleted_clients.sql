-- `member_count` comptait les liaisons même quand le contact était en corbeille
-- (soft delete). La colonne Contacts des groupes restait donc figée après
-- suppression / restauration de contacts.

create or replace function public.sync_client_group_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
begin
  gid := coalesce(new.group_id, old.group_id);
  update public.client_groups
  set member_count = (
    select count(*)::integer
    from public.client_group_members m
    join public.clients c on c.id = m.client_id
    where m.group_id = gid
      and c.deleted_at is null
  )
  where id = gid;
  return coalesce(new, old);
end;
$$;

-- Resync des groupes d'un contact quand il part en corbeille ou revient.
create or replace function public.sync_member_count_for_client()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.client_groups g
  set member_count = (
    select count(*)::integer
    from public.client_group_members m
    join public.clients c on c.id = m.client_id
    where m.group_id = g.id
      and c.deleted_at is null
  )
  where g.id in (
    select m.group_id
    from public.client_group_members m
    where m.client_id = new.id
  );
  return new;
end;
$$;

drop trigger if exists clients_sync_group_member_count on public.clients;
create trigger clients_sync_group_member_count
  after update of deleted_at on public.clients
  for each row
  when (old.deleted_at is distinct from new.deleted_at)
  execute function public.sync_member_count_for_client();

update public.client_groups g
set member_count = coalesce(
  (
    select count(*)::integer
    from public.client_group_members m
    join public.clients c on c.id = m.client_id
    where m.group_id = g.id
      and c.deleted_at is null
  ),
  0
);
