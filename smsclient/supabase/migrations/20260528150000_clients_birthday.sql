-- Date d'anniversaire optionnelle pour les contacts.
alter table public.clients
  add column if not exists birthday date;
