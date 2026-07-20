-- Langue interface profil (fr | en).

alter table public.user_profiles
  add column if not exists language text not null default 'fr';

alter table public.user_profiles
  drop constraint if exists user_profiles_language_check;

alter table public.user_profiles
  add constraint user_profiles_language_check
  check (language in ('fr', 'en'));
