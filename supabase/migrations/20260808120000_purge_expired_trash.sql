-- Purge auto corbeille : hard-delete contacts/groupes soft-deleted depuis > 30 jours.
-- pg_cron quotidien (même pattern que resolve_scheduled_campaigns).

create index if not exists clients_deleted_at_purge_idx
  on public.clients (deleted_at)
  where deleted_at is not null;

create index if not exists client_groups_deleted_at_purge_idx
  on public.client_groups (deleted_at)
  where deleted_at is not null;

create or replace function public.purge_expired_trash()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  retention interval := interval '30 days';
begin
  -- members / qr_wheel_spins : ON DELETE CASCADE depuis clients / client_groups
  delete from public.clients
  where deleted_at is not null
    and deleted_at < now() - retention;

  delete from public.client_groups
  where deleted_at is not null
    and deleted_at < now() - retention;
end;
$$;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'purge-expired-trash',
  '15 3 * * *',
  $$select public.purge_expired_trash()$$
);
