-- Date réelle de désinscription (STOP SMS), distincte de created_at / last_sms_sent_at.

alter table public.clients
  add column if not exists unsubscribed_at timestamptz;

update public.clients
set unsubscribed_at = created_at
where stop_sms = true
  and unsubscribed_at is null;

create or replace function public.clients_set_unsubscribed_at()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.stop_sms then
      new.unsubscribed_at := coalesce(new.unsubscribed_at, now());
    end if;
    return new;
  end if;

  if new.stop_sms and not coalesce(old.stop_sms, false) then
    new.unsubscribed_at := now();
  elsif not new.stop_sms then
    new.unsubscribed_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_clients_set_unsubscribed_at on public.clients;
create trigger trg_clients_set_unsubscribed_at
  before insert or update of stop_sms, opt_in on public.clients
  for each row
  execute function public.clients_set_unsubscribed_at();

create index if not exists clients_user_unsubscribed_at_idx
  on public.clients (user_id, unsubscribed_at desc)
  where stop_sms = true and unsubscribed_at is not null;
