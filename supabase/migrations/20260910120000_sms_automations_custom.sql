-- Automatisations personnalisées (sans preset) + planification récurrente.

alter table public.sms_automations
  drop constraint if exists sms_automations_user_preset;

alter table public.sms_automations
  alter column preset_key drop not null;

create unique index if not exists sms_automations_user_preset_uidx
  on public.sms_automations (user_id, preset_key)
  where preset_key is not null;

alter table public.sms_automations
  drop constraint if exists sms_automations_kind_check;

alter table public.sms_automations
  add column if not exists recurrence_unit text,
  add column if not exists recurrence_interval smallint,
  add column if not exists recurrence_weekday smallint;

alter table public.sms_automations
  add constraint sms_automations_kind_check
  check (kind in ('birthday', 'fixed_date', 'recurring'));

alter table public.sms_automations
  add constraint sms_automations_recurrence_unit_check
  check (
    recurrence_unit is null
    or recurrence_unit in ('days', 'weeks', 'months')
  );

alter table public.sms_automations
  add constraint sms_automations_recurrence_interval_check
  check (recurrence_interval is null or recurrence_interval > 0);

alter table public.sms_automations
  add constraint sms_automations_recurrence_weekday_check
  check (
    recurrence_weekday is null
    or (recurrence_weekday >= 1 and recurrence_weekday <= 7)
  );
