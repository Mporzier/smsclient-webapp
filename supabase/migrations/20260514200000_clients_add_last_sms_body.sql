-- Ajoute un aperçu du dernier SMS envoyé au contact.
alter table public.clients add column if not exists last_sms_body text;
