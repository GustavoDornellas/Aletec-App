alter table public.units
add column if not exists storage_box text;

create index if not exists idx_units_storage_box on public.units(storage_box);
