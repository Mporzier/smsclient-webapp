-- Préférences colonnes visibles par liste (json par clé liste).

alter table public.user_profiles
  add column if not exists list_column_visibility jsonb not null default '{}'::jsonb;

comment on column public.user_profiles.list_column_visibility is
  'Map liste → { columnId: false } pour colonnes masquées (TanStack VisibilityState).';
