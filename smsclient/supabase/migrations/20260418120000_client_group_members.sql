-- Relation N-N : un contact peut appartenir à plusieurs groupes (`client_groups`).
-- Exécuter après `20260417120000_client_groups.sql`.

create table if not exists public.client_group_members (
  client_id uuid not null references public.clients (id) on delete cascade,
  group_id uuid not null references public.client_groups (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, group_id)
);

create index if not exists client_group_members_group_id_idx
  on public.client_group_members (group_id);

alter table public.client_group_members enable row level security;

create policy "client_group_members_select_own"
  on public.client_group_members for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_group_members.client_id
        and c.user_id = auth.uid()
    )
  );

create policy "client_group_members_insert_own"
  on public.client_group_members for insert
  with check (
    exists (
      select 1 from public.clients c
      where c.id = client_group_members.client_id
        and c.user_id = auth.uid()
    )
    and exists (
      select 1 from public.client_groups g
      where g.id = client_group_members.group_id
        and g.user_id = auth.uid()
    )
  );

create policy "client_group_members_delete_own"
  on public.client_group_members for delete
  using (
    exists (
      select 1 from public.clients c
      where c.id = client_group_members.client_id
        and c.user_id = auth.uid()
    )
  );

-- Rétrocompat : une ligne de liaison par ancien `clients.group_label` qui correspond à un groupe existant.
insert into public.client_group_members (client_id, group_id)
select c.id, g.id
from public.clients c
inner join public.client_groups g
  on g.user_id = c.user_id
  and btrim(g.name) = btrim(c.group_label)
where btrim(coalesce(c.group_label, '')) <> ''
  and btrim(c.group_label) <> 'Non classé'
on conflict do nothing;
