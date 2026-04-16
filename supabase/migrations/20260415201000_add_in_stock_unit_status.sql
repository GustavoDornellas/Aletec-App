alter table public.units
drop constraint if exists units_status_check;

alter table public.units
add constraint units_status_check
check (status in ('in_stock', 'available', 'used', 'sold'));

alter table public.units
alter column status set default 'in_stock';
