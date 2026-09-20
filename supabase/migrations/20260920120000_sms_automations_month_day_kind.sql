alter table public.sms_automations
  add column if not exists recurrence_month_day_kind text;

alter table public.sms_automations
  drop constraint if exists sms_automations_recurrence_month_day_kind_check;

alter table public.sms_automations
  add constraint sms_automations_recurrence_month_day_kind_check
  check (
    recurrence_month_day_kind is null
    or recurrence_month_day_kind in ('fixed', 'first', 'last')
  );
