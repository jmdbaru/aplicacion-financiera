import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type CategoryType = "expense" | "income" | "both";

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  parent_id: string | null;
  is_default: boolean;
  is_active: boolean;
  user_id: string | null;
};

export type BudgetProgress = {
  id: string;
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
  amount: number;
  alert_threshold_pct: number;
  spent: number;
  remaining: number;
  usage_pct: number;
  status: "ok" | "warning" | "exceeded";
};

export type BudgetOverview = {
  period_start: string;
  currency_code: string;
  total_budget: number;
  budgeted_spent: number;
  outside_budget_spent: number;
  items: BudgetProgress[];
};

function client() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

export function monthStart(value = new Date()): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-01`;
}

export function shiftMonth(periodStart: string, delta: number): string {
  const [year, month] = periodStart.split("-").map(Number);
  return monthStart(new Date(year, month - 1 + delta, 1));
}

export async function loadCategories(session: Session, includeArchived = false): Promise<Category[]> {
  let query = client()
    .from("categories")
    .select("id,name,type,icon,color,parent_id,is_default,is_active,user_id")
    .or(`is_default.eq.true,user_id.eq.${session.user.id}`)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });
  if (!includeArchived) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function createCategory(
  session: Session,
  input: Pick<Category, "name" | "type" | "icon" | "color" | "parent_id">,
) {
  const { error } = await client().from("categories").insert({
    ...input,
    name: input.name.trim(),
    icon: input.icon.trim(),
    user_id: session.user.id,
    is_default: false,
  });
  if (error) throw error;
}

export async function updateCategory(
  session: Session,
  categoryId: string,
  input: Partial<Pick<Category, "name" | "icon" | "color" | "parent_id">>,
) {
  const { error } = await client()
    .from("categories")
    .update(input)
    .eq("id", categoryId)
    .eq("user_id", session.user.id)
    .eq("is_default", false);
  if (error) throw error;
}

export async function setCategoryActive(categoryId: string, active: boolean) {
  const { error } = await client().rpc("set_category_active", {
    p_category_id: categoryId,
    p_is_active: active,
  });
  if (error) throw error;
}

function parseOverview(value: unknown): BudgetOverview {
  const payload = value as BudgetOverview;
  return {
    ...payload,
    total_budget: Number(payload.total_budget ?? 0),
    budgeted_spent: Number(payload.budgeted_spent ?? 0),
    outside_budget_spent: Number(payload.outside_budget_spent ?? 0),
    items: (payload.items ?? []).map((item) => ({
      ...item,
      amount: Number(item.amount),
      spent: Number(item.spent),
      remaining: Number(item.remaining),
      usage_pct: Number(item.usage_pct),
    })),
  };
}

export async function loadBudgetOverview(periodStart: string, currencyCode: string) {
  const { data, error } = await client().rpc("get_budget_overview", {
    p_period_start: periodStart,
    p_currency_code: currencyCode,
  });
  if (error) throw error;
  return parseOverview(data);
}

export async function createBudget(
  session: Session,
  input: {
    category_id: string;
    period_start: string;
    currency_code: string;
    amount: number;
    alert_threshold_pct: number;
  },
) {
  const { error } = await client().from("budgets").insert({ ...input, user_id: session.user.id });
  if (error) throw error;
}

export async function updateBudget(
  session: Session,
  budgetId: string,
  input: { amount: number; alert_threshold_pct: number },
) {
  const { error } = await client()
    .from("budgets")
    .update(input)
    .eq("id", budgetId)
    .eq("user_id", session.user.id);
  if (error) throw error;
}

export async function deleteBudget(session: Session, budgetId: string) {
  const { error } = await client()
    .from("budgets")
    .delete()
    .eq("id", budgetId)
    .eq("user_id", session.user.id);
  if (error) throw error;
}
