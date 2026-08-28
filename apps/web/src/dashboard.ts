import { type BudgetOverview } from "./budgets";
import { supabase } from "./supabase";

export type DashboardMonth = { period_start: string; income: number; expenses: number; balance: number };
export type DashboardTransaction = { id: string; effective_date: string; description: string; transaction_type: string; category_name: string | null; amount: number };
export type DashboardOverview = {
  period_start: string; currency_code: string; available: number; active_accounts: number;
  income: number; expenses: number; balance: number; budget: BudgetOverview;
  monthly: DashboardMonth[]; recent_transactions: DashboardTransaction[];
};

function client() { if (!supabase) throw new Error("Supabase no está configurado."); return supabase; }
function numeric(value: unknown) { return Number(value ?? 0); }

export function parseDashboard(value: unknown): DashboardOverview {
  const payload = value as DashboardOverview;
  return {
    ...payload, available: numeric(payload.available), income: numeric(payload.income), expenses: numeric(payload.expenses), balance: numeric(payload.balance), active_accounts: numeric(payload.active_accounts),
    budget: { ...payload.budget, total_budget: numeric(payload.budget?.total_budget), budgeted_spent: numeric(payload.budget?.budgeted_spent), outside_budget_spent: numeric(payload.budget?.outside_budget_spent), items: (payload.budget?.items ?? []).map((item) => ({ ...item, amount: numeric(item.amount), spent: numeric(item.spent), remaining: numeric(item.remaining), usage_pct: numeric(item.usage_pct) })) },
    monthly: (payload.monthly ?? []).map((item) => ({ ...item, income: numeric(item.income), expenses: numeric(item.expenses), balance: numeric(item.balance) })),
    recent_transactions: (payload.recent_transactions ?? []).map((item) => ({ ...item, amount: numeric(item.amount) })),
  };
}

export function chartCeiling(months: DashboardMonth[]) { return Math.max(1, ...months.flatMap((month) => [month.income, month.expenses])); }
export async function loadDashboardOverview(periodStart: string, currencyCode: string) {
  const { data, error } = await client().rpc("get_dashboard_overview", { p_period_start: periodStart, p_currency_code: currencyCode });
  if (error) throw error;
  return parseDashboard(data);
}
