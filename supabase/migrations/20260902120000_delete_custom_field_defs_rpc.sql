-- Supprime defs + clés JSONB `clients.custom_fields` en une transaction.
-- Pas de PATCH contact par contact (évite URL trop longue / N updates).

create or replace function public.delete_contact_custom_field_defs(p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  keys text[];
begin
  if p_ids is null or cardinality(p_ids) = 0 then
    return;
  end if;

  keys := array(select x::text from unnest(p_ids) as x);

  delete from public.contact_custom_field_defs
  where user_id = auth.uid()
    and id = any (p_ids);

  update public.clients
  set custom_fields = custom_fields - keys
  where user_id = auth.uid()
    and custom_fields ?| keys;
end;
$$;

grant execute on function public.delete_contact_custom_field_defs(uuid[]) to authenticated;
