-- Realtime : la liste des contacts se met à jour côté app (ex. saisie via QR) sans recharger.
do $migration$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'clients'
  ) then
    alter publication supabase_realtime add table public.clients;
  end if;
end
$migration$;
