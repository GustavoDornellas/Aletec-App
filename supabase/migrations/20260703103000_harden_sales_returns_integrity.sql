alter table public.units
drop constraint if exists units_status_check;

update public.units
set status = 'returned'
where status in ('Devolvida', 'Devolvido');

alter table public.units
add constraint units_status_check
check (status in ('in_stock', 'available', 'used', 'sold', 'returned'));

create index if not exists idx_sales_data_recebimento
on public.sales(data_recebimento);

create or replace function public.sync_unit_commercial_status(target_unit_id uuid)
returns void
language plpgsql
as $$
begin
  if target_unit_id is null then
    return;
  end if;

  if exists (
    select 1
    from public.returns
    join public.sales on sales.id = returns.sale_id
    where sales.unit_id = target_unit_id
  ) then
    update public.units
    set status = 'returned'
    where id = target_unit_id;
    return;
  end if;

  if exists (
    select 1
    from public.sales
    where unit_id = target_unit_id
  ) then
    update public.units
    set status = 'sold'
    where id = target_unit_id;
    return;
  end if;

  update public.units
  set status = 'in_stock'
  where id = target_unit_id
    and status in ('sold', 'returned');
end;
$$;

create or replace function public.handle_sales_unit_status_sync()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_unit_commercial_status(old.unit_id);
    return old;
  end if;

  perform public.sync_unit_commercial_status(new.unit_id);

  if tg_op = 'UPDATE' and old.unit_id is distinct from new.unit_id then
    perform public.sync_unit_commercial_status(old.unit_id);
  end if;

  return new;
end;
$$;

create or replace function public.handle_returns_unit_status_sync()
returns trigger
language plpgsql
as $$
declare
  target_unit_id uuid;
begin
  if tg_op = 'DELETE' then
    select unit_id into target_unit_id
    from public.sales
    where id = old.sale_id;

    perform public.sync_unit_commercial_status(target_unit_id);
    return old;
  end if;

  select unit_id into target_unit_id
  from public.sales
  where id = new.sale_id;

  perform public.sync_unit_commercial_status(target_unit_id);

  if tg_op = 'UPDATE' and old.sale_id is distinct from new.sale_id then
    select unit_id into target_unit_id
    from public.sales
    where id = old.sale_id;

    perform public.sync_unit_commercial_status(target_unit_id);
  end if;

  return new;
end;
$$;

drop trigger if exists sales_unit_status_sync on public.sales;
create trigger sales_unit_status_sync
after insert or update or delete on public.sales
for each row
execute function public.handle_sales_unit_status_sync();

drop trigger if exists returns_unit_status_sync on public.returns;
create trigger returns_unit_status_sync
after insert or update or delete on public.returns
for each row
execute function public.handle_returns_unit_status_sync();

alter table public.returns
add column if not exists updated_at timestamp with time zone not null default timezone('utc', now());

drop trigger if exists returns_set_updated_at on public.returns;
create trigger returns_set_updated_at
before update on public.returns
for each row
execute function public.set_updated_at();

update public.units
set status = case
  when exists (
    select 1
    from public.returns
    join public.sales on sales.id = returns.sale_id
    where sales.unit_id = units.id
  ) then 'returned'
  when exists (
    select 1
    from public.sales
    where sales.unit_id = units.id
  ) then 'sold'
  else status
end
where status in ('in_stock', 'available', 'used', 'sold', 'returned');
