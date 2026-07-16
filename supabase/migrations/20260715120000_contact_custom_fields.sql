-- Champs personnalisés contacts : définitions par compte + valeurs JSONB sur clients.

create table if not exists public.contact_custom_field_defs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  field_type text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint contact_custom_field_defs_label_len check (char_length(trim(label)) >= 1),
  constraint contact_custom_field_defs_type_chk check (
    field_type in ('text', 'number', 'date')
  )
);

create unique index if not exists contact_custom_field_defs_user_label_uidx
  on public.contact_custom_field_defs (user_id, lower(trim(label)));

create index if not exists contact_custom_field_defs_user_sort_idx
  on public.contact_custom_field_defs (user_id, sort_order asc, created_at asc);

alter table public.contact_custom_field_defs enable row level security;

create policy "contact_custom_field_defs_select_own"
  on public.contact_custom_field_defs for select
  using (auth.uid() = user_id);

create policy "contact_custom_field_defs_insert_own"
  on public.contact_custom_field_defs for insert
  with check (auth.uid() = user_id);

create policy "contact_custom_field_defs_update_own"
  on public.contact_custom_field_defs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "contact_custom_field_defs_delete_own"
  on public.contact_custom_field_defs for delete
  using (auth.uid() = user_id);

alter table public.clients
  add column if not exists custom_fields jsonb not null default '{}'::jsonb;
