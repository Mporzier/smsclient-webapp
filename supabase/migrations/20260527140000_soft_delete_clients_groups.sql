-- Corbeille : suppression douce des contacts et groupes (restauration possible).

alter table public.clients
  add column if not exists deleted_at timestamptz;

alter table public.client_groups
  add column if not exists deleted_at timestamptz;

alter table public.clients
  drop constraint if exists clients_user_phone;

create unique index if not exists clients_user_phone_active_idx
  on public.clients (user_id, phone_e164)
  where deleted_at is null;

alter table public.client_groups
  drop constraint if exists client_groups_user_name;

create unique index if not exists client_groups_user_name_active_idx
  on public.client_groups (user_id, name)
  where deleted_at is null;

create index if not exists clients_user_deleted_at_idx
  on public.clients (user_id, deleted_at desc)
  where deleted_at is not null;

create index if not exists client_groups_user_deleted_at_idx
  on public.client_groups (user_id, deleted_at desc)
  where deleted_at is not null;
