-- El color identifica visualmente bancos y tarjetas; el resto conserva la identidad neutra del tipo.
update public.financial_accounts
set card_color = 'emerald'
where account_type not in ('bank', 'credit_card')
  and card_color <> 'emerald';

alter table public.financial_accounts
  drop constraint if exists financial_accounts_card_color_visual_types;

alter table public.financial_accounts
  add constraint financial_accounts_card_color_visual_types
  check (account_type in ('bank', 'credit_card') or card_color = 'emerald');
