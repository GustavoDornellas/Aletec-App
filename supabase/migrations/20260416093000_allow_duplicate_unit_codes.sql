alter table public.units
drop constraint if exists units_product_id_sn_key;

insert into public.units (
  product_id,
  sn,
  status,
  quantity,
  image,
  storage_box,
  created_at,
  updated_at
)
select
  units.product_id,
  units.sn,
  units.status,
  1,
  units.image,
  units.storage_box,
  units.created_at,
  units.updated_at
from public.units
cross join lateral generate_series(2, units.quantity) as copies(copy_number)
where units.quantity > 1;

update public.units
set quantity = 1
where quantity > 1;

create index if not exists idx_units_product_id_sn
on public.units(product_id, sn);

update public.products
set
  total = coalesce((select sum(quantity) from public.units where product_id = products.id), 0),
  available = coalesce((select sum(quantity) from public.units where product_id = products.id and status = 'available'), 0),
  sold = coalesce((select sum(quantity) from public.units where product_id = products.id and status = 'sold'), 0),
  updated_at = timezone('utc', now());
