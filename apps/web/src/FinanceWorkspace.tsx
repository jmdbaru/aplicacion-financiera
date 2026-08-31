import {
  Archive,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Plus,
  RotateCcw,
  WalletCards,
} from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { BudgetWorkspace } from "./BudgetWorkspace";
import { DashboardWorkspace } from "./DashboardWorkspace";
import { RecurringWorkspace } from "./RecurringWorkspace";
import { GoalsWorkspace } from "./GoalsWorkspace";
import { loadCategories, type Category } from "./budgets";
import {
  createAccount,
  createTransaction,
  loadAccounts,
  loadTransactions,
  reverseTransaction,
  setAccountActive,
  type AccountType,
  type FinancialAccount,
  type LedgerTransaction,
  type TransactionType,
} from "./finance";

type View = "summary" | "accounts" | "transactions" | "categories" | "budgets" | "recurring" | "goals";

const accountLabels: Record<AccountType, string> = {
  cash: "Efectivo",
  bank: "Banco",
  credit_card: "Tarjeta",
  loan: "Préstamo",
  investment: "Inversión",
  other: "Otra",
};

const transactionLabels: Record<TransactionType, string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
  adjustment: "Ajuste",
  reversal: "Reverso",
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value);
}

export function FinanceWorkspace({ session, defaultCurrency }: { session: Session; defaultCurrency: string }) {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [view, setView] = useState<View>("summary");
  const [dialog, setDialog] = useState<"account" | "transaction" | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const refreshCategories = useCallback(async () => {
    setCategories(await loadCategories(session, true));
  }, [session]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextAccounts, result, nextCategories] = await Promise.all([
        loadAccounts(session, true),
        loadTransactions(session, page, search, dateFrom, dateTo),
        loadCategories(session, true),
      ]);
      setAccounts(nextAccounts);
      setTransactions(result.rows);
      setCount(result.count);
      setCategories(nextCategories);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar tus datos.");
    } finally {
      setLoading(false);
    }
  }, [session, page, search, dateFrom, dateTo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activeAccounts = accounts.filter((account) => account.is_active);
  const activeCategories = categories.filter((category) => category.is_active);
  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const movements = useMemo(() => transactions.map((transaction) => {
    const entry = transaction.ledger_entries.find((item) => item.entry_kind === "account");
    return {
      ...transaction,
      displayAmount: Number(entry?.amount ?? 0),
      currency: entry?.currency_code ?? defaultCurrency,
    };
  }), [transactions, defaultCurrency]);

  async function runAction(action: () => Promise<void>, fallback: string) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : fallback);
    } finally {
      setBusy(false);
    }
  }

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(async () => {
      await createAccount(session, {
        name: String(form.get("name")),
        account_type: String(form.get("type")) as AccountType,
        currency_code: String(form.get("currency")).toUpperCase(),
      });
      setDialog(null);
      await refresh();
    }, "No se pudo crear la cuenta.");
  }

  async function submitTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const account = accounts.find((item) => item.id === form.get("account"));
    const destination = accounts.find((item) => item.id === form.get("destination"));
    if (!account) {
      setError("Selecciona una cuenta.");
      return;
    }
    await runAction(async () => {
      await createTransaction({
        effectiveDate: String(form.get("date")),
        description: String(form.get("description")),
        type: String(form.get("type")) as Exclude<TransactionType, "reversal">,
        amount: Number(form.get("amount")),
        account,
        destination,
        adjustmentDirection: String(form.get("direction")) as "credit" | "debit",
        categoryId: String(form.get("category") || "") || null,
      });
      setDialog(null);
      await refresh();
    }, "No se pudo registrar el movimiento.");
  }

  const showQuickMovement = view === "summary" || view === "accounts" || view === "transactions";

  return <>
    <header className="topbar">
      <div className="view-tabs" aria-label="Secciones">
        <Tab active={view === "summary"} onClick={() => setView("summary")}>Resumen</Tab>
        <Tab active={view === "accounts"} onClick={() => setView("accounts")}>Cuentas</Tab>
        <Tab active={view === "transactions"} onClick={() => setView("transactions")}>Movimientos</Tab>
        <Tab active={view === "categories"} onClick={() => setView("categories")}>Categorías</Tab>
        <Tab active={view === "budgets"} onClick={() => setView("budgets")}>Presupuestos</Tab>
        <Tab active={view === "recurring"} onClick={() => setView("recurring")}>Recurrentes</Tab>
        <Tab active={view === "goals"} onClick={() => setView("goals")}>Objetivos</Tab>
      </div>
      {showQuickMovement && <button className="primary-button" type="button" onClick={() => setDialog("transaction")} disabled={!activeAccounts.length}><Plus size={18} /> Añadir movimiento</button>}
    </header>
    <main id="main-content" className="main-content">
      {error && <p className="inline-error" role="alert">{error}</p>}
      {loading ? <section className="skeleton-grid" aria-label="Cargando"><i /><i /><i /></section> : <>
        {view === "summary" && <DashboardWorkspace currency={defaultCurrency} onCreateAccount={() => setDialog("account")} />}
        {view === "accounts" && <AccountsView accounts={accounts} busy={busy} onCreate={() => setDialog("account")} onToggle={(account) => void runAction(async () => { await setAccountActive(session, account.id, !account.is_active); await refresh(); }, "No se pudo cambiar el estado de la cuenta.")} />}
        {view === "transactions" && <TransactionsView movements={movements} transactions={transactions} count={count} page={page} search={search} dateFrom={dateFrom} dateTo={dateTo} categoryNames={categoryNames} canCreate={Boolean(activeAccounts.length)} onCreate={() => setDialog("transaction")} onSearch={(value) => { setSearch(value); setPage(0); }} onDateFrom={(value) => { setDateFrom(value); setPage(0); }} onDateTo={(value) => { setDateTo(value); setPage(0); }} onPage={setPage} onReverse={(id) => void runAction(async () => { await reverseTransaction(id); await refresh(); }, "No se pudo revertir el movimiento.")} />}
        {(view === "categories" || view === "budgets") && <BudgetWorkspace session={session} currency={defaultCurrency} categories={categories} mode={view} onCategoriesChanged={refreshCategories} />}
        {view === "recurring" && <RecurringWorkspace session={session} accounts={accounts} currency={defaultCurrency} />}
        {view === "goals" && <GoalsWorkspace session={session} currency={defaultCurrency} />}
      </>}
    </main>
    {dialog && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}><section className="finance-dialog" role="dialog" aria-modal="true" aria-labelledby="finance-dialog-title"><h2 id="finance-dialog-title">{dialog === "account" ? "Nueva cuenta" : "Nuevo movimiento"}</h2>{dialog === "account" ? <AccountForm currency={defaultCurrency} busy={busy} onSubmit={submitAccount} onCancel={() => setDialog(null)} /> : <TransactionForm accounts={activeAccounts} categories={activeCategories} busy={busy} onSubmit={submitTransaction} onCancel={() => setDialog(null)} />}</section></div>}
  </>;
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className={active ? "is-active" : ""} onClick={onClick}>{children}</button>;
}

function AccountsView({ accounts, busy, onCreate, onToggle }: { accounts: FinancialAccount[]; busy: boolean; onCreate: () => void; onToggle: (account: FinancialAccount) => void }) {
  return <section><div className="section-heading"><div><p className="eyebrow">CUENTAS</p><h1>Tus cuentas</h1></div><button className="primary-button" onClick={onCreate}><Plus size={18} /> Nueva cuenta</button></div>{accounts.length ? <div className="account-grid">{accounts.map((account) => <article className={`account-card ${account.is_active ? "" : "is-archived"}`} key={account.id}><div><span>{accountLabels[account.account_type]}</span><h2>{account.name}</h2></div><strong>{money(account.balance, account.currency_code)}</strong><button className="text-button" disabled={busy} onClick={() => onToggle(account)}>{account.is_active ? <><Archive size={15} /> Archivar</> : "Restaurar"}</button></article>)}</div> : <EmptyState title="Aún no hay cuentas" action="Crear la primera" onClick={onCreate} />}</section>;
}

type Movement = LedgerTransaction & { displayAmount: number; currency: string };

function TransactionsView({ movements, transactions, count, page, search, dateFrom, dateTo, categoryNames, canCreate, onCreate, onSearch, onDateFrom, onDateTo, onPage, onReverse }: { movements: Movement[]; transactions: LedgerTransaction[]; count: number; page: number; search: string; dateFrom: string; dateTo: string; categoryNames: Map<string, string>; canCreate: boolean; onCreate: () => void; onSearch: (value: string) => void; onDateFrom: (value: string) => void; onDateTo: (value: string) => void; onPage: (value: number | ((current: number) => number)) => void; onReverse: (id: string) => void }) {
  return <section><div className="section-heading"><div><p className="eyebrow">LEDGER</p><h1>Movimientos</h1></div><button className="primary-button" onClick={onCreate} disabled={!canCreate}><Plus size={18} /> Nuevo</button></div><div className="filters"><input aria-label="Buscar movimientos" placeholder="Buscar concepto" value={search} onChange={(event) => onSearch(event.target.value)} /><input aria-label="Desde" type="date" value={dateFrom} onChange={(event) => onDateFrom(event.target.value)} /><input aria-label="Hasta" type="date" value={dateTo} onChange={(event) => onDateTo(event.target.value)} /></div>{movements.length ? <div className="transaction-list">{movements.map((item) => <article key={item.id}><span className={`movement-icon movement-icon--${item.transaction_type}`}>{item.transaction_type === "income" ? <ArrowDownLeft /> : item.transaction_type === "transfer" ? <ArrowLeftRight /> : <ArrowUpRight />}</span><div><strong>{item.description}</strong><small>{new Date(`${item.effective_date}T00:00:00`).toLocaleDateString("es-ES")} · {transactionLabels[item.transaction_type]} · {item.category_id ? categoryNames.get(item.category_id) ?? "Categoría archivada" : "Sin categoría"}</small></div><b className={item.displayAmount >= 0 ? "positive" : "negative"}>{money(item.displayAmount, item.currency)}</b>{item.transaction_type !== "reversal" && !transactions.some((candidate) => candidate.reversed_transaction_id === item.id) && <button className="icon-action" aria-label={`Revertir ${item.description}`} title="Crear reverso" onClick={() => onReverse(item.id)}><RotateCcw size={16} /></button>}</article>)}</div> : <EmptyState title="No hay movimientos para estos filtros" action="Añadir movimiento" onClick={onCreate} />}<div className="pagination"><button disabled={page === 0} onClick={() => onPage((value) => value - 1)}>Anterior</button><span>Página {page + 1}</span><button disabled={(page + 1) * 10 >= count} onClick={() => onPage((value) => value + 1)}>Siguiente</button></div></section>;
}

function EmptyState({ title, action, onClick }: { title: string; action: string; onClick: () => void }) {
  return <div className="empty-state"><WalletCards size={28} /><h2>{title}</h2><button className="secondary-button" onClick={onClick}>{action}</button></div>;
}

function AccountForm({ currency, busy, onSubmit, onCancel }: { currency: string; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  return <form className="finance-form" onSubmit={onSubmit}><label>Nombre<input name="name" maxLength={100} required autoFocus placeholder="Cuenta principal" /></label><label>Tipo<select name="type" defaultValue="bank">{Object.entries(accountLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Moneda<input name="currency" defaultValue={currency} pattern="[A-Z]{3}" maxLength={3} required /></label><div className="dialog-actions"><button type="button" className="text-button" onClick={onCancel}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Crear cuenta"}</button></div></form>;
}

function TransactionForm({ accounts, categories, busy, onSubmit, onCancel }: { accounts: FinancialAccount[]; categories: Category[]; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const [type, setType] = useState<Exclude<TransactionType, "reversal">>("expense");
  const [sourceId, setSourceId] = useState(accounts[0]?.id ?? "");
  const source = accounts.find((item) => item.id === sourceId);
  const destinations = accounts.filter((item) => item.id !== sourceId && item.currency_code === source?.currency_code);
  const validCategories = categories.filter((category) => category.type === type || category.type === "both");
  return <form className="finance-form" onSubmit={onSubmit}><label>Tipo<select name="type" value={type} onChange={(event) => setType(event.target.value as Exclude<TransactionType, "reversal">)}><option value="expense">Gasto</option><option value="income">Ingreso</option><option value="transfer">Transferencia</option><option value="adjustment">Ajuste</option></select></label><label>Fecha<input type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label>Concepto<input name="description" maxLength={240} required autoFocus placeholder="Ej. Compra semanal" /></label><label>Importe<input name="amount" type="number" min="0.0001" step="0.0001" required /></label><label>Cuenta<select name="account" value={sourceId} onChange={(event) => setSourceId(event.target.value)} required>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name} · {account.currency_code}</option>)}</select></label>{(type === "expense" || type === "income") && <label>Categoría<select name="category" defaultValue=""><option value="">Sin categoría</option>{validCategories.map((category) => <option value={category.id} key={category.id}>{category.parent_id ? "↳ " : ""}{category.name}</option>)}</select></label>}{type === "transfer" && <label>Destino<select name="destination" required>{destinations.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select>{!destinations.length && <small>Necesitas otra cuenta activa en {source?.currency_code}.</small>}</label>}{type === "adjustment" && <label>Dirección<select name="direction"><option value="credit">Aumentar saldo</option><option value="debit">Reducir saldo</option></select></label>}<div className="dialog-actions"><button type="button" className="text-button" onClick={onCancel}>Cancelar</button><button className="primary-button" disabled={busy || (type === "transfer" && !destinations.length)}>{busy ? "Registrando…" : "Registrar"}</button></div></form>;
}
