-- Dates clés calendrier marketing (dashboard accueil).
create table if not exists public.marketing_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  event_date date not null,
  event_type text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint marketing_calendar_events_title_len check (char_length(trim(title)) >= 1),
  constraint marketing_calendar_events_type_check check (
    event_type in (
      'holiday',
      'commercial',
      'seasonal',
      'professional',
      'personal'
    )
  )
);

create index if not exists marketing_calendar_events_user_date_idx
  on public.marketing_calendar_events (user_id, event_date);

alter table public.marketing_calendar_events enable row level security;

create policy "marketing_calendar_events_select_own"
  on public.marketing_calendar_events for select
  using (auth.uid() = user_id);

create policy "marketing_calendar_events_insert_own"
  on public.marketing_calendar_events for insert
  with check (auth.uid() = user_id);

create policy "marketing_calendar_events_update_own"
  on public.marketing_calendar_events for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "marketing_calendar_events_delete_own"
  on public.marketing_calendar_events for delete
  using (auth.uid() = user_id);
