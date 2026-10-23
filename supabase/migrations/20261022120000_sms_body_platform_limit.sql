-- Plafond 2 SMS (GSM / Unicode) — miroir lib/proto/smsEncoding.ts
-- Rejette insert/update direct Supabase si corps trop long.

create or replace function public.sms_gsm_basic_chars()
returns text
language sql
immutable
parallel safe
as $$
  select
    U&'@\00A3$\00A5\u00E8\u00E9\u00F9\u00EC\u00F2\u00C7'
    || chr(10) || U&'\00D8\u00F8' || chr(13)
    || U&'\u0394_\03A6\u0393\u039B\u03A9\u03A0\u03A8\u03A3\u0398\u039E\u00C6\u00E6\u00DF\u00C9'
    || ' !"#' || U&'\00A4' || '%&''()*+,-./0123456789:;<=>?'
    || U&'\00A1\u00BF\u00C4\u00D6\u00D1\u00DC\u00A7\u00E0'
    || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
$$;

create or replace function public.sms_gsm_extended_chars()
returns text
language sql
immutable
parallel safe
as $$
  select U&'^{}\005B~]|' || U&'\20AC';
$$;

create or replace function public.sms_is_gsm7(t text)
returns boolean
language plpgsql
immutable
strict
as $$
declare
  i integer;
  ch text;
  basic constant text := public.sms_gsm_basic_chars();
  ext constant text := public.sms_gsm_extended_chars();
begin
  for i in 1..char_length(t) loop
    ch := substr(t, i, 1);
    if position(ch in ext) > 0 or position(ch in basic) > 0 then
      continue;
    end if;
    return false;
  end loop;
  return true;
end;
$$;

create or replace function public.sms_gsm_septets(t text)
returns integer
language plpgsql
immutable
strict
as $$
declare
  i integer;
  ch text;
  units integer := 0;
  basic constant text := public.sms_gsm_basic_chars();
  ext constant text := public.sms_gsm_extended_chars();
begin
  for i in 1..char_length(t) loop
    ch := substr(t, i, 1);
    if position(ch in ext) > 0 then
      units := units + 2;
    elsif position(ch in basic) > 0 then
      units := units + 1;
    else
      return null;
    end if;
  end loop;
  return units;
end;
$$;

-- Unités UTF-16 facturées (aligné String.length JS / UCS-2 SMS).
create or replace function public.sms_utf16_units(t text)
returns integer
language sql
immutable
strict
as $$
  select case
    when octet_length(convert_to(t, 'UTF16')) <= 2 then 0
    else (octet_length(convert_to(t, 'UTF16')) - 2) / 2
  end;
$$;

create or replace function public.sms_segment_count(t text)
returns integer
language plpgsql
immutable
strict
as $$
declare
  billable integer;
  single_limit constant integer := 160;
  gsm_concat constant integer := 153;
  unicode_single constant integer := 70;
  unicode_concat constant integer := 67;
begin
  if public.sms_is_gsm7(t) then
    billable := public.sms_gsm_septets(t);
    if billable is null then
      billable := public.sms_utf16_units(t);
      if billable <= unicode_single then
        return 1;
      end if;
      return ceil(billable::numeric / unicode_concat)::integer;
    end if;
    if billable <= single_limit then
      return 1;
    end if;
    return ceil(billable::numeric / gsm_concat)::integer;
  end if;

  billable := public.sms_utf16_units(t);
  if billable <= unicode_single then
    return 1;
  end if;
  return ceil(billable::numeric / unicode_concat)::integer;
end;
$$;

create or replace function public.sms_body_within_platform_limit(t text)
returns boolean
language plpgsql
immutable
as $$
declare
  max_segments constant integer := 2;
  gsm_max constant integer := 306;
  unicode_max constant integer := 134;
  billable integer;
  segments integer;
begin
  if t is null or btrim(t) = '' then
    return true;
  end if;

  segments := public.sms_segment_count(t);
  if segments > max_segments then
    return false;
  end if;

  if public.sms_is_gsm7(t) then
    billable := public.sms_gsm_septets(t);
    if billable is null then
      billable := public.sms_utf16_units(t);
      return billable <= unicode_max;
    end if;
    return billable <= gsm_max;
  end if;

  billable := public.sms_utf16_units(t);
  return billable <= unicode_max;
end;
$$;

comment on function public.sms_body_within_platform_limit(text) is
  'True si le texte tient en ≤2 segments SMS (GSM 306 septets ou Unicode 134 unités UTF-16).';

alter table public.sms_campaigns
  drop constraint if exists sms_campaigns_sms_segments_check;

alter table public.sms_campaigns
  add constraint sms_campaigns_sms_segments_check
  check (sms_segments >= 1 and sms_segments <= 2);

alter table public.sms_campaigns
  add constraint sms_campaigns_body_platform_limit
  check (public.sms_body_within_platform_limit(body));

alter table public.sms_automations
  add constraint sms_automations_body_platform_limit
  check (public.sms_body_within_platform_limit(body));

alter table public.user_sms_templates
  add constraint user_sms_templates_body_platform_limit
  check (public.sms_body_within_platform_limit(body));
