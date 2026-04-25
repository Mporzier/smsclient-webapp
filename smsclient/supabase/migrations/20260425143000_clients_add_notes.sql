-- Colonne notes libre pour les contacts.
-- Compatible avec les environnements déjà migrés.

alter table if exists public.clients
  add column if not exists notes text not null default '';
