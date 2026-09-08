-- Objetivos: controles opcionales, sin alterar aportaciones ni saldos derivados.
-- Versión asignada al reconciliar el historial remoto.
alter table public.savings_goals
  add column priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  add column contribution_frequency text not null default 'none' check (contribution_frequency in ('none', 'weekly', 'monthly'));

alter table public.savings_goals
  drop constraint savings_goals_status_check,
  add constraint savings_goals_status_check check (status in ('active', 'paused', 'completed', 'archived'));

create index savings_goals_user_status_priority_idx
  on public.savings_goals (user_id, status, priority, target_date);

create or replace function public.get_savings_goals_overview()
returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',g.id,'name',g.name,'target_amount',g.target_amount,'currency_code',g.currency_code,
    'target_date',g.target_date,'status',g.status,'priority',g.priority,
    'contribution_frequency',g.contribution_frequency,'contributed',coalesce(c.contributed,0),
    'remaining',greatest(g.target_amount-coalesce(c.contributed,0),0),
    'progress_pct',least(round(coalesce(c.contributed,0)/g.target_amount*100,2),100)
  ) order by case g.priority when 'high' then 1 when 'normal' then 2 else 3 end, g.target_date nulls last, g.created_at desc),'[]'::jsonb)
  from public.savings_goals g
  left join lateral (select sum(amount) contributed from public.goal_contributions where goal_id=g.id and user_id=g.user_id) c on true
  where g.user_id=auth.uid();
$$;

revoke all on function public.get_savings_goals_overview() from public, anon;
grant execute on function public.get_savings_goals_overview() to authenticated;
