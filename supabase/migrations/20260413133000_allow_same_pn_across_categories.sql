alter table public.products
drop constraint if exists products_pn_key;

alter table public.products
add constraint products_pn_category_key unique (pn, category);
