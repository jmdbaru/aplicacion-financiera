-- Preferencia visual privada por cuenta; solo usa una paleta cerrada para mantener contraste.
alter table public.financial_accounts
  add column if not exists card_color text not null default 'emerald'
  check (card_color in ('emerald', 'blue', 'violet', 'rose'));
