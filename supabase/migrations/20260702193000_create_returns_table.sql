create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null unique references public.sales(id) on delete restrict,
  teve_custo boolean not null default false,
  valor_prejuizo numeric(12, 2) not null default 0 check (valor_prejuizo >= 0),
  motivo text not null,
  observacao text,
  data_devolucao date not null default current_date,
  created_at timestamp with time zone not null default timezone('utc', now()),
  constraint returns_cost_value_check
    check (
      (teve_custo = true and valor_prejuizo > 0)
      or (teve_custo = false and valor_prejuizo = 0)
    )
);

create index if not exists idx_returns_sale_id
on public.returns(sale_id);

create index if not exists idx_returns_data_devolucao
on public.returns(data_devolucao);

alter table public.returns enable row level security;

drop policy if exists "Allow all returns access" on public.returns;
create policy "Allow all returns access" on public.returns for all using (true) with check (true);
