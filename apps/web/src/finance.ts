import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AccountType = "cash" | "bank" | "credit_card" | "loan" | "investment" | "other";
export type TransactionType = "income" | "expense" | "transfer" | "adjustment" | "reversal";

export type FinancialAccount = {
  id: string;
  name: string;
  account_type: AccountType;
  currency_code: string;
  is_active: boolean;
  balance: number;
};

export type LedgerEntry = {
  account_id: string | null;
  entry_kind: "account" | "external";
  currency_code: string;
  amount: number;
};

export type LedgerTransaction = {
  id: string;
  effective_date: string;
  description: string;
  transaction_type: TransactionType;
  category_id: string | null;
  reversed_transaction_id: string | null;
  ledger_entries: LedgerEntry[];
};

function client() {
  if (!supabase) throw new Error("Supabase no está configurado.");
  return supabase;
}

export async function loadAccounts(session: Session, includeArchived = false): Promise<FinancialAccount[]> {
  let accountsQuery = client()
    .from("financial_accounts")
    .select("id,name,account_type,currency_code,is_active")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });
  if (!includeArchived) accountsQuery = accountsQuery.eq("is_active", true);
  const [{ data: accounts, error: accountsError }, { data: entries, error: entriesError }] = await Promise.all([
    accountsQuery,
    client().from("ledger_entries").select("account_id,amount").eq("user_id", session.user.id).eq("entry_kind", "account"),
  ]);
  if (accountsError) throw accountsError;
  if (entriesError) throw entriesError;
  const balances = new Map<string, number>();
  for (const entry of entries ?? []) {
    if (entry.account_id) balances.set(entry.account_id, (balances.get(entry.account_id) ?? 0) + Number(entry.amount));
  }
  return (accounts ?? []).map((account) => ({ ...account, balance: balances.get(account.id) ?? 0 })) as FinancialAccount[];
}

export async function createAccount(session: Session, input: { name: string; account_type: AccountType; currency_code: string }) {
  const { error } = await client().from("financial_accounts").insert({ ...input, name: input.name.trim(), user_id: session.user.id });
  if (error) throw error;
}

export async function setAccountActive(session: Session, accountId: string, active: boolean) {
  const { error } = await client().from("financial_accounts").update({ is_active: active, archived_at: active ? null : new Date().toISOString() }).eq("id", accountId).eq("user_id", session.user.id);
  if (error) throw error;
}

export async function loadTransactions(session: Session, page: number, search: string, dateFrom: string, dateTo: string) {
  const pageSize = 10;
  let query = client()
    .from("ledger_transactions")
    .select("id,effective_date,description,transaction_type,category_id,reversed_transaction_id,ledger_entries(account_id,entry_kind,currency_code,amount)", { count: "exact" })
    .eq("user_id", session.user.id)
    .order("effective_date", { ascending: false })
    .order("id", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);
  if (search.trim()) query = query.ilike("description", `%${search.trim().replaceAll("%", "\\%").replaceAll("_", "\\_")}%`);
  if (dateFrom) query = query.gte("effective_date", dateFrom);
  if (dateTo) query = query.lte("effective_date", dateTo);
  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as LedgerTransaction[], count: count ?? 0, pageSize };
}

export type TransactionInput = {
  effectiveDate: string;
  description: string;
  type: Exclude<TransactionType, "reversal">;
  amount: number;
  account: FinancialAccount;
  destination?: FinancialAccount;
  adjustmentDirection?: "credit" | "debit";
  categoryId?: string | null;
};

export function buildLedgerEntries(input: TransactionInput): LedgerEntry[] {
  const signed = input.type === "expense" || (input.type === "adjustment" && input.adjustmentDirection === "debit") ? -input.amount : input.amount;
  return input.type === "transfer" && input.destination
    ? [
        { account_id: input.account.id, entry_kind: "account", currency_code: input.account.currency_code, amount: -input.amount },
        { account_id: input.destination.id, entry_kind: "account", currency_code: input.destination.currency_code, amount: input.amount },
      ]
    : [
        { account_id: input.account.id, entry_kind: "account", currency_code: input.account.currency_code, amount: signed },
        { account_id: null, entry_kind: "external", currency_code: input.account.currency_code, amount: -signed },
      ];
}

export async function createTransaction(input: TransactionInput) {
  const entries = buildLedgerEntries(input);
  const { error } = await client().rpc("create_ledger_transaction", {
    p_effective_date: input.effectiveDate,
    p_description: input.description.trim(),
    p_transaction_type: input.type,
    p_entries: entries,
    p_category_id: input.categoryId ?? null,
  });
  if (error) throw error;
}

export async function reverseTransaction(transactionId: string) {
  const { error } = await client().rpc("reverse_ledger_transaction", {
    p_transaction_id: transactionId,
    p_effective_date: new Date().toISOString().slice(0, 10),
    p_description: null,
  });
  if (error) throw error;
}
