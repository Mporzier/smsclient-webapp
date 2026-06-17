-- Avis utilisateurs (formulaire « Soumettre un avis »).

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null
    check (category in ('suggestion', 'technical', 'improvement', 'feature', 'other')),
  message text not null
    check (
      char_length(trim(message)) > 0
      and char_length(message) <= 2000
    ),
  created_at timestamptz not null default now()
);

create index if not exists user_feedback_user_created_idx
  on public.user_feedback (user_id, created_at desc);

alter table public.user_feedback enable row level security;

create policy "user_feedback_insert_own"
  on public.user_feedback for insert
  with check (auth.uid() = user_id);

create policy "user_feedback_select_own"
  on public.user_feedback for select
  using (auth.uid() = user_id);
