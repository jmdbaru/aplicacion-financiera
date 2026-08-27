-- Fase 4: protege cambios estructurales y centraliza el archivo de categorías.

create or replace function public.validate_category_hierarchy()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_parent public.categories%rowtype;
begin
  new.name := trim(new.name);
  new.icon := trim(new.icon);
  new.updated_at := now();

  if new.is_default and new.parent_id is not null then
    raise exception 'default_category_cannot_have_parent';
  end if;

  if new.parent_id is not null then
    select * into v_parent
    from public.categories
    where id = new.parent_id;

    if not found
      or v_parent.parent_id is not null
      or not v_parent.is_active
      or not (v_parent.is_default or v_parent.user_id = new.user_id)
      or (v_parent.type <> 'both' and v_parent.type <> new.type)
    then
      raise exception 'invalid_parent_category';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if (old.type <> new.type or old.parent_id is distinct from new.parent_id)
      and (
        exists (select 1 from public.ledger_transactions where category_id = old.id)
        or exists (select 1 from public.budgets where category_id = old.id)
      )
    then
      raise exception 'category_structure_in_use';
    end if;

    if old.is_active and not new.is_active and new.parent_id is null
      and exists (
        select 1 from public.categories child
        where child.parent_id = old.id and child.is_active
      )
    then
      raise exception 'category_has_active_children';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.set_category_active(
  p_category_id uuid,
  p_is_active boolean
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_category public.categories%rowtype;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;

  select * into v_category
  from public.categories
  where id = p_category_id and user_id = v_user_id and not is_default
  for update;

  if not found then raise exception 'category_not_found'; end if;

  if not p_is_active and v_category.parent_id is null then
    update public.categories
    set is_active = false, archived_at = now()
    where parent_id = v_category.id
      and user_id = v_user_id
      and is_active;
  end if;

  update public.categories
  set is_active = p_is_active,
      archived_at = case when p_is_active then null else now() end
  where id = v_category.id and user_id = v_user_id;
end;
$$;

revoke execute on function public.set_category_active(uuid,boolean) from public, anon;
grant execute on function public.set_category_active(uuid,boolean) to authenticated;
