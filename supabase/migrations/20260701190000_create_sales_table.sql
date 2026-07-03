create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null unique references public.units(id) on delete restrict,
  valor_vendido numeric(12, 2) not null check (valor_vendido > 0),
  valor_liquido numeric(12, 2) not null check (valor_liquido >= 0),
  data_venda date not null,
  data_recebimento date,
  observacao text,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  constraint sales_receipt_after_sale_check
    check (data_recebimento is null or data_recebimento >= data_venda)
);

create index if not exists idx_sales_unit_id
on public.sales(unit_id);

create index if not exists idx_sales_data_venda
on public.sales(data_venda);

alter table public.sales enable row level security;

drop policy if exists "Allow all sales access" on public.sales;
create policy "Allow all sales access" on public.sales for all using (true) with check (true);

drop trigger if exists sales_set_updated_at on public.sales;
create trigger sales_set_updated_at
before update on public.sales
for each row
execute function public.set_updated_at();
