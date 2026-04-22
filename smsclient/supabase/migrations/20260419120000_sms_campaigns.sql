-- Campagnes SMS (historique + métadonnées) par compte.
-- Exécuter dans le SQL Editor Supabase.

create table if not exists public.sms_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  sender text not null default '',
  body text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'sent', 'failed', 'cancelled')),
  send_mode text not null default 'now'
    check (send_mode in ('now', 'sched')),
  recipient_count int not null default 0 check (recipient_count >= 0),
  sms_segments int not null default 1 check (sms_segments >= 1),
  credits_estimated int not null default 0 check (credits_estimated >= 0),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists sms_campaigns_user_id_created_idx
  on public.sms_campaigns (user_id, created_at desc);

alter table public.sms_campaigns enable row level security;

create policy "sms_campaigns_select_own"
  on public.sms_campaigns for select
  using (auth.uid() = user_id);

create policy "sms_campaigns_insert_own"
  on public.sms_campaigns for insert
  with check (auth.uid() = user_id);

create policy "sms_campaigns_update_own"
  on public.sms_campaigns for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sms_campaigns_delete_own"
  on public.sms_campaigns for delete
  using (auth.uid() = user_id);
