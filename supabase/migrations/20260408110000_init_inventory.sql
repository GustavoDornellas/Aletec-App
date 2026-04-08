create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pn text not null unique,
  category text not null check (category in ('Placa Principal', 'Placa Fonte', 'Outros')),
  price numeric(12, 2) not null check (price >= 0),
  image text,
  status text not null default 'Ativo' check (status in ('Ativo', 'Inativo', 'Em Falta')),
  total integer not null default 0 check (total >= 0),
  available integer not null default 0 check (available >= 0),
  sold integer not null default 0 check (sold >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sn text not null,
  status text not null check (status in ('Disponível pra venda', 'Utilizada', 'Vendida')),
  quantity integer not null default 1 check (quantity > 0),
  image text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id, sn)
);

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_created_at on public.products(created_at desc);
create index if not exists idx_units_product_id on public.units(product_id);
create index if not exists idx_units_status on public.units(status);
create index if not exists idx_units_updated_at on public.units(updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_product_inventory_counts(target_product_id uuid)
returns void
language plpgsql
as $$
begin
  update public.products
  set
    total = coalesce((select sum(quantity) from public.units where product_id = target_product_id), 0),
    available = coalesce((select sum(quantity) from public.units where product_id = target_product_id and status = 'Disponível pra venda'), 0),
    sold = coalesce((select sum(quantity) from public.units where product_id = target_product_id and status = 'Vendida'), 0),
    updated_at = timezone('utc', now())
  where id = target_product_id;
end;
$$;

create or replace function public.handle_units_inventory_sync()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_product_inventory_counts(old.product_id);
    return old;
  end if;

  perform public.sync_product_inventory_counts(new.product_id);

  if tg_op = 'UPDATE' and old.product_id is distinct from new.product_id then
    perform public.sync_product_inventory_counts(old.product_id);
  end if;

  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists units_set_updated_at on public.units;
create trigger units_set_updated_at
before update on public.units
for each row
execute function public.set_updated_at();

drop trigger if exists units_inventory_sync on public.units;
create trigger units_inventory_sync
after insert or update or delete on public.units
for each row
execute function public.handle_units_inventory_sync();

alter table public.products enable row level security;
alter table public.units enable row level security;

drop policy if exists "Allow all products access" on public.products;
create policy "Allow all products access" on public.products for all using (true) with check (true);

drop policy if exists "Allow all units access" on public.units;
create policy "Allow all units access" on public.units for all using (true) with check (true);
