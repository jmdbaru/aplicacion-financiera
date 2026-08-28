import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type RecurringRule = { id: string; name: string; transaction_type: "income" | "expense" | "transfer" | "adjustment"; account_id: string; destination_account_id: string | null; currency_code: string; amount: number; frequency: "daily" | "weekly" | "monthly"; interval_count: number; weekday: number | null; monthly_day: number | null; next_run_on: string; end_on: string | null; time_zone: string; is_active: boolean };
function client() { if (!supabase) throw new Error("Supabase no está configurado."); return supabase; }
export async function loadRecurringRules(session: Session) { const { data, error } = await client().from("recurring_rules").select("*").eq("user_id", session.user.id).order("next_run_on"); if (error) throw error; return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) })) as RecurringRule[]; }
export async function createRecurringRule(session: Session, input: Omit<RecurringRule, "id" | "is_active">) { const { error } = await client().from("recurring_rules").insert({ ...input, user_id: session.user.id, name: input.name.trim() }); if (error) throw error; }
export async function generateRecurring(until: string) { const { data, error } = await client().rpc("generate_recurring_transactions", { p_until: until }); if (error) throw error; return Number((data as { created?: number })?.created ?? 0); }
