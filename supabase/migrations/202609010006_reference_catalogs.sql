create table public.app_currencies (
  code char(3) primary key check (code ~ '^[A-Z]{3}$'),
  name text not null check (char_length(trim(name)) between 1 and 80),
  symbol text not null check (char_length(trim(symbol)) between 1 and 8),
  locale text not null default 'es-ES',
  sort_order smallint not null default 100,
  is_active boolean not null default true
);

create table public.app_icons (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  label text not null check (char_length(trim(label)) between 1 and 60),
  icon_group text not null default 'general',
  sort_order smallint not null default 100,
  is_active boolean not null default true
);

insert into public.app_currencies (code, name, symbol, locale, sort_order) values
  ('EUR', 'Euro', '€', 'es-ES', 10),
  ('CZK', 'Corona checa', 'Kč', 'cs-CZ', 20),
  ('USD', 'Dólar estadounidense', '$', 'en-US', 30),
  ('GBP', 'Libra esterlina', '£', 'en-GB', 40),
  ('CHF', 'Franco suizo', 'CHF', 'de-CH', 50),
  ('PLN', 'Złoty polaco', 'zł', 'pl-PL', 60),
  ('JPY', 'Yen japonés', '¥', 'ja-JP', 70),
  ('CAD', 'Dólar canadiense', 'CA$', 'en-CA', 80),
  ('MXN', 'Peso mexicano', 'MX$', 'es-MX', 90)
on conflict (code) do update set name = excluded.name, symbol = excluded.symbol, locale = excluded.locale, sort_order = excluded.sort_order;

insert into public.app_icons (slug, label, icon_group, sort_order) values
  ('tag', 'Etiqueta', 'general', 10), ('home', 'Hogar', 'hogar', 20),
  ('shopping-bag', 'Compras', 'gasto', 30), ('utensils', 'Restaurantes', 'gasto', 40),
  ('car', 'Transporte', 'gasto', 50), ('heart-pulse', 'Salud', 'gasto', 60),
  ('graduation-cap', 'Educación', 'gasto', 70), ('plane', 'Viajes', 'gasto', 80),
  ('gift', 'Regalos', 'gasto', 90), ('receipt-text', 'Facturas', 'gasto', 100),
  ('zap', 'Suministros', 'hogar', 110), ('landmark', 'Banco', 'ingreso', 120),
  ('briefcase-business', 'Trabajo', 'ingreso', 130), ('chart-no-axes-combined', 'Inversión', 'ingreso', 140),
  ('circle-dollar-sign', 'Dinero', 'general', 150), ('piggy-bank', 'Ahorro', 'general', 160)
on conflict (slug) do update set label = excluded.label, icon_group = excluded.icon_group, sort_order = excluded.sort_order;

alter table public.app_currencies enable row level security;
alter table public.app_icons enable row level security;

create policy app_currencies_read_active on public.app_currencies for select to authenticated using (is_active);
create policy app_icons_read_active on public.app_icons for select to authenticated using (is_active);

revoke all on public.app_currencies, public.app_icons from anon;
grant select on public.app_currencies, public.app_icons to authenticated;
