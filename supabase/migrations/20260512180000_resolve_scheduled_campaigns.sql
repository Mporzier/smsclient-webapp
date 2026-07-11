-- Résolution automatique des campagnes programmées.
-- Marque les campagnes "scheduled" comme "sent" quand scheduled_at <= now().
-- Utilise pg_cron (activé par défaut sur Supabase) pour exécuter chaque minute.

-- 1. Fonction qui résout les campagnes programmées arrivées à échéance.
create or replace function public.resolve_scheduled_campaigns()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.sms_campaigns
  set
    status = 'sent',
    sent_at = now()
  where
    status = 'scheduled'
    and scheduled_at is not null
    and scheduled_at <= now();
end;
$$;

-- 2. Activer l'extension pg_cron si pas déjà fait.
create extension if not exists pg_cron with schema pg_catalog;

-- 3. Planifier l'exécution toutes les minutes.
-- (Supabase exécute pg_cron dans le contexte postgres, security definer donne accès à la table.)
select cron.schedule(
  'resolve-scheduled-campaigns',
  '* * * * *',
  $$select public.resolve_scheduled_campaigns()$$
);
