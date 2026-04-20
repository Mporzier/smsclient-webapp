-- Segments / groupes de contacts par compte utilisateur.
-- À exécuter dans Supabase SQL Editor après la migration `clients`.

create table if not exists public.client_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text not null default '',
  last_campaign_at timestamptz,
  created_at timestamptz not null default now(),
  constraint client_groups_user_name unique (user_id, name)
);

create index if not exists client_groups_user_id_created_idx
  on public.client_groups (user_id, created_at desc);

alter table public.client_groups enable row level security;

create policy "client_groups_select_own"
  on public.client_groups for select
  using (auth.uid() = user_id);

create policy "client_groups_insert_own"
  on public.client_groups for insert
  with check (auth.uid() = user_id);

create policy "client_groups_update_own"
  on public.client_groups for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "client_groups_delete_own"
  on public.client_groups for delete
  using (auth.uid() = user_id);

-- Groupes par défaut à chaque nouveau compte (Prospects → conversion, Clients → base, VIP → premium).
create or replace function public.create_default_client_groups_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.client_groups (user_id, name, description) values
    (new.id, 'Prospects', 'Pistes ou contacts à qualifier'),
    (new.id, 'Clients', 'Clientèle active'),
    (new.id, 'Clients VIP', 'Meilleurs clients, fidélité ou offres premium');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_client_groups on auth.users;
create trigger on_auth_user_created_client_groups
  after insert on auth.users
  for each row execute function public.create_default_client_groups_for_new_user();

-- Comptes déjà existants sans aucun groupe : même trio par défaut (une seule fois).
insert into public.client_groups (user_id, name, description)
select u.id, v.name, v.description
from auth.users u
cross join (
  values
    ('Prospects', 'Pistes ou contacts à qualifier'),
    ('Clients', 'Clientèle active'),
    ('Clients VIP', 'Meilleurs clients, fidélité ou offres premium')
) as v(name, description)
where not exists (
  select 1 from public.client_groups g where g.user_id = u.id limit 1
);
