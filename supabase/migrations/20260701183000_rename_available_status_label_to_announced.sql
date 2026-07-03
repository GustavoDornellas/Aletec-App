update public.units
set status = case
  when lower(status) in ('available', 'in_stock', 'used', 'sold') then lower(status)
  when status in (
    'Anunciada',
    'Anunciadas',
    'Anunciado',
    'Anunciados',
    'DisponÃƒÂ­vel pra venda',
    'DisponÃ­vel pra venda',
    'DisponÃ­vel para venda',
    'Disponivel pra venda',
    'Disponivel para venda'
  ) then 'available'
  when status = 'Em estoque' then 'in_stock'
  when status = 'Utilizada' then 'used'
  when status = 'Vendida' then 'sold'
  else status
end;

alter table public.units
drop constraint if exists units_status_check;

alter table public.units
add constraint units_status_check
check (status in ('in_stock', 'available', 'used', 'sold'));

update public.products
set
  total = coalesce((select sum(quantity) from public.units where product_id = products.id), 0),
  available = coalesce((select sum(quantity) from public.units where product_id = products.id and status = 'available'), 0),
  sold = coalesce((select sum(quantity) from public.units where product_id = products.id and status = 'sold'), 0),
  updated_at = timezone('utc', now());
