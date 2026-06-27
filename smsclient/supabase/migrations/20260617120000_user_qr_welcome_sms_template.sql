alter table public.user_qr_codes
  add column if not exists welcome_sms_template text not null default 'Bonjour ⟦prénom⟧, merci pour votre inscription ! Nous sommes ravis de vous compter parmi nos clients.';
