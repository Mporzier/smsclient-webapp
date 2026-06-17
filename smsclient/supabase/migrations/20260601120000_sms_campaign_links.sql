-- Liens courts SMS : minification, suivi des clics, redirection.

create table if not exists public.sms_campaign_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  campaign_id uuid references public.sms_campaigns (id) on delete set null,
  label text not null default '',
  original_url text not null,
  short_code text not null,
  click_count int not null default 0 check (click_count >= 0),
  created_at timestamptz not null default now(),
  constraint sms_campaign_links_short_code_unique unique (short_code),
  constraint sms_campaign_links_user_original_unique unique (user_id, original_url)
);

create index if not exists sms_campaign_links_user_created_idx
  on public.sms_campaign_links (user_id, created_at desc);

alter table public.sms_campaign_links enable row level security;

create policy "sms_campaign_links_select_own"
  on public.sms_campaign_links for select
  using (auth.uid() = user_id);

create policy "sms_campaign_links_insert_own"
  on public.sms_campaign_links for insert
  with check (auth.uid() = user_id);

create policy "sms_campaign_links_update_own"
  on public.sms_campaign_links for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sms_campaign_links_delete_own"
  on public.sms_campaign_links for delete
  using (auth.uid() = user_id);

-- Crée ou réutilise un lien court pour l'utilisateur connecté.
create or replace function public.create_sms_short_link(
  p_original_url text,
  p_campaign_id uuid default null,
  p_label text default ''
)
returns table (
  id uuid,
  short_code text,
  short_url text,
  original_url text,
  click_count int,
  created_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_url text;
  v_code text;
  v_row public.sms_campaign_links%rowtype;
  v_base text := 'https://l.sms.fm';
  v_attempt int := 0;
begin
  if v_user_id is null then
    raise exception 'Non authentifié';
  end if;

  v_url := trim(coalesce(p_original_url, ''));
  if v_url = '' then
    raise exception 'URL requise';
  end if;
  if v_url !~* '^https?://' then
    v_url := 'https://' || v_url;
  end if;

  select * into v_row
  from public.sms_campaign_links l
  where l.user_id = v_user_id and l.original_url = v_url;

  if found then
    if p_campaign_id is not null and v_row.campaign_id is null then
      update public.sms_campaign_links scl
      set campaign_id = p_campaign_id
      where scl.id = v_row.id
      returning * into v_row;
    end if;
    return query
    select
      v_row.id,
      v_row.short_code,
      v_base || '/' || v_row.short_code,
      v_row.original_url,
      v_row.click_count,
      v_row.created_at;
    return;
  end if;

  loop
    v_attempt := v_attempt + 1;
    if v_attempt > 20 then
      raise exception 'Impossible de générer un code court unique';
    end if;
    v_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 7);
    exit when not exists (
      select 1
      from public.sms_campaign_links scl
      where scl.short_code = v_code
    );
  end loop;

  insert into public.sms_campaign_links (
    user_id,
    campaign_id,
    label,
    original_url,
    short_code
  )
  values (
    v_user_id,
    p_campaign_id,
    coalesce(nullif(trim(p_label), ''), ''),
    v_url,
    v_code
  )
  returning * into v_row;

  return query
  select
    v_row.id,
    v_row.short_code,
    v_base || '/' || v_row.short_code,
    v_row.original_url,
    v_row.click_count,
    v_row.created_at;
end;
$$;

grant execute on function public.create_sms_short_link(text, uuid, text) to authenticated;

-- Résolution publique (redirection).
create or replace function public.resolve_sms_short_link(p_short_code text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select l.original_url
  from public.sms_campaign_links l
  where l.short_code = trim(p_short_code)
  limit 1;
$$;

grant execute on function public.resolve_sms_short_link(text) to anon, authenticated;

-- Compteur de clics (appelé par la passerelle de redirection).
create or replace function public.track_sms_link_click(p_short_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.sms_campaign_links scl
  set click_count = scl.click_count + 1
  where scl.short_code = trim(p_short_code);
end;
$$;

grant execute on function public.track_sms_link_click(text) to anon, authenticated;
