update public.units
set status = case
  when lower(status) in ('available', 'used', 'sold') then lower(status)
  when status = 'DisponÃ­vel pra venda' then 'available'
  when status = 'Disponível pra venda' then 'available'
  when status = 'Disponível para venda' then 'available'
  when status = 'Disponivel pra venda' then 'available'
  when status = 'Disponivel para venda' then 'available'
  when status = 'Utilizada' then 'used'
  when status = 'Vendida' then 'sold'
  else status
end;

alter table public.units
drop constraint if exists units_status_check;

alter table public.units
add constraint units_status_check
check (status in ('available', 'used', 'sold'));

create or replace function public.sync_product_inventory_counts(target_product_id uuid)
returns void
language plpgsql
as $$
begin
  update public.products
  set
    total = coalesce((select sum(quantity) from public.units where product_id = target_product_id), 0),
    available = coalesce((select sum(quantity) from public.units where product_id = target_product_id and status = 'available'), 0),
    sold = coalesce((select sum(quantity) from public.units where product_id = target_product_id and status = 'sold'), 0),
    updated_at = timezone('utc', now())
  where id = target_product_id;
end;
$$;

update public.products
set
  total = coalesce((select sum(quantity) from public.units where product_id = products.id), 0),
  available = coalesce((select sum(quantity) from public.units where product_id = products.id and status = 'available'), 0),
  sold = coalesce((select sum(quantity) from public.units where product_id = products.id and status = 'sold'), 0),
  updated_at = timezone('utc', now());
