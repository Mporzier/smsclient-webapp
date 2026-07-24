-- Compteur dénormalisé pour tri serveur lazyload (colonne Contacts des groupes).

alter table public.client_groups
  add column if not exists member_count integer not null default 0;

-- Backfill
update public.client_groups g
set member_count = coalesce(
  (
    select count(*)::integer
    from public.client_group_members m
    where m.group_id = g.id
  ),
  0
);

create index if not exists client_groups_user_member_count_idx
  on public.client_groups (user_id, member_count desc, id);

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
    from public.client_group_members
    where group_id = gid
  )
  where id = gid;
  return coalesce(new, old);
end;
$$;

drop trigger if exists client_group_members_sync_count on public.client_group_members;
create trigger client_group_members_sync_count
  after insert or delete on public.client_group_members
  for each row
  execute function public.sync_client_group_member_count();
