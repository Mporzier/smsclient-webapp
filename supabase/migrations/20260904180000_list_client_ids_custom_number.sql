create or replace function public.list_client_ids_custom_number(
  p_field_id uuid,
  p_op text,
  p_a numeric,
  p_b numeric default null,
  p_eligible_only boolean default true
)
returns uuid[]
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(array_agg(c.id order by c.id), '{}'::uuid[])
  from public.clients c
  where c.user_id = auth.uid()
    and c.deleted_at is null
    and (
      not p_eligible_only
      or (c.opt_in = true and c.stop_sms = false)
    )
    and nullif(c.custom_fields->>p_field_id::text, '') is not null
    and (c.custom_fields->>p_field_id::text) ~ '^-?[0-9]+(\.[0-9]+)?$'
    and (
      (p_op = 'eq' and (c.custom_fields->>p_field_id::text)::numeric = p_a)
      or (p_op = 'neq' and (c.custom_fields->>p_field_id::text)::numeric <> p_a)
      or (p_op = 'gt' and (c.custom_fields->>p_field_id::text)::numeric > p_a)
      or (p_op = 'gte' and (c.custom_fields->>p_field_id::text)::numeric >= p_a)
      or (p_op = 'lt' and (c.custom_fields->>p_field_id::text)::numeric < p_a)
      or (p_op = 'lte' and (c.custom_fields->>p_field_id::text)::numeric <= p_a)
      or (
        p_op = 'between'
        and (c.custom_fields->>p_field_id::text)::numeric >= p_a
        and (c.custom_fields->>p_field_id::text)::numeric <= coalesce(p_b, p_a)
      )
    );
$$;

grant execute on function public.list_client_ids_custom_number(uuid, text, numeric, numeric, boolean) to authenticated;
