import { Archive, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Plus, RotateCcw, WalletCards } from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
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

const accountLabels: Record<AccountType, string> = { cash: "Efectivo", bank: "Banco", credit_card: "Tarjeta", loan: "Préstamo", investment: "Inversión", other: "Otra" };
const transactionLabels: Record<TransactionType, string> = { income: "Ingreso", expense: "Gasto", transfer: "Transferencia", adjustment: "Ajuste", reversal: "Reverso" };

function money(value: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value);
}

export function FinanceWorkspace({ session, defaultCurrency }: { session: Session; defaultCurrency: string }) {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [view, setView] = useState<"summary" | "accounts" | "transactions">("summary");
  const [dialog, setDialog] = useState<"account" | "transaction" | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [nextAccounts, result] = await Promise.all([loadAccounts(session, true), loadTransactions(session, page, search, dateFrom, dateTo)]);
      setAccounts(nextAccounts); setTransactions(result.rows); setCount(result.count);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudieron cargar tus datos."); }
    finally { setLoading(false); }
  }, [session, page, search, dateFrom, dateTo]);
  useEffect(() => { void refresh(); }, [refresh]);

  const activeAccounts = accounts.filter((account) => account.is_active);
  const total = activeAccounts.reduce((sum, account) => account.currency_code === defaultCurrency ? sum + account.balance : sum, 0);
  const movements = useMemo(() => transactions.map((transaction) => {
    const entry = transaction.ledger_entries.find((item) => item.entry_kind === "account");
    return { ...transaction, displayAmount: Number(entry?.amount ?? 0), currency: entry?.currency_code ?? defaultCurrency };
  }), [transactions, defaultCurrency]);

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      await createAccount(session, { name: String(form.get("name")), account_type: String(form.get("type")) as AccountType, currency_code: String(form.get("currency")).toUpperCase() });
      setDialog(null); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo crear la cuenta."); }
    finally { setBusy(false); }
  }

  async function submitTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget); const account = accounts.find((item) => item.id === form.get("account")); const destination = accounts.find((item) => item.id === form.get("destination"));
    if (!account) { setError("Selecciona una cuenta."); setBusy(false); return; }
    try {
      await createTransaction({ effectiveDate: String(form.get("date")), description: String(form.get("description")), type: String(form.get("type")) as Exclude<TransactionType, "reversal">, amount: Number(form.get("amount")), account, destination, adjustmentDirection: String(form.get("direction")) as "credit" | "debit" });
      setDialog(null); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo registrar el movimiento."); }
    finally { setBusy(false); }
  }

  return <>
    <header className="topbar"><div className="view-tabs" aria-label="Secciones"><button className={view === "summary" ? "is-active" : ""} onClick={() => setView("summary")}>Resumen</button><button className={view === "accounts" ? "is-active" : ""} onClick={() => setView("accounts")}>Cuentas</button><button className={view === "transactions" ? "is-active" : ""} onClick={() => setView("transactions")}>Movimientos</button></div><button className="primary-button" type="button" onClick={() => setDialog("transaction")} disabled={!activeAccounts.length}><Plus size={18} /> Añadir movimiento</button></header>
    <main id="main-content" className="main-content">
      {error && <p className="inline-error" role="alert">{error}</p>}
      {loading ? <section className="skeleton-grid" aria-label="Cargando"><i /><i /><i /></section> : <>
        {view === "summary" && <><section className="welcome"><div><p className="eyebrow">NÚCLEO FINANCIERO</p><h1>Tu dinero, sin ruido.</h1><p className="intro">Saldos derivados de un ledger de doble partida; cada cambio conserva su historia.</p></div><button className="secondary-button" onClick={() => setDialog("account")}><WalletCards size={18} /> Crear cuenta</button></section><section className="metrics-grid"><article className="metric-card"><p>Disponible en {defaultCurrency}</p><strong>{money(total, defaultCurrency)}</strong><span className="metric-detail">{activeAccounts.length} cuentas activas</span></article><article className="metric-card"><p>Movimientos filtrados</p><strong>{count}</strong><span className="metric-detail">Histórico trazable</span></article><article className="metric-card"><p>Monedas</p><strong>{new Set(activeAccounts.map((item) => item.currency_code)).size || 0}</strong><span className="metric-detail">Sin mezclar saldos</span></article></section></>}
        {view === "accounts" && <section><div className="section-heading"><div><p className="eyebrow">CUENTAS</p><h1>Tus cuentas</h1></div><button className="primary-button" onClick={() => setDialog("account")}><Plus size={18} /> Nueva cuenta</button></div>{accounts.length ? <div className="account-grid">{accounts.map((account) => <article className={`account-card ${account.is_active ? "" : "is-archived"}`} key={account.id}><div><span>{accountLabels[account.account_type]}</span><h2>{account.name}</h2></div><strong>{money(account.balance, account.currency_code)}</strong><button className="text-button" onClick={() => void setAccountActive(session, account.id, !account.is_active).then(refresh)}>{account.is_active ? <><Archive size={15} /> Archivar</> : "Restaurar"}</button></article>)}</div> : <EmptyState title="Aún no hay cuentas" action="Crear la primera" onClick={() => setDialog("account")} />}</section>}
        {view === "transactions" && <section><div className="section-heading"><div><p className="eyebrow">LEDGER</p><h1>Movimientos</h1></div><button className="primary-button" onClick={() => setDialog("transaction")} disabled={!activeAccounts.length}><Plus size={18} /> Nuevo</button></div><div className="filters"><input aria-label="Buscar movimientos" placeholder="Buscar concepto" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /><input aria-label="Desde" type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(0); }} /><input aria-label="Hasta" type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(0); }} /></div>{movements.length ? <div className="transaction-list">{movements.map((item) => <article key={item.id}><span className={`movement-icon movement-icon--${item.transaction_type}`}>{item.transaction_type === "income" ? <ArrowDownLeft /> : item.transaction_type === "transfer" ? <ArrowLeftRight /> : <ArrowUpRight />}</span><div><strong>{item.description}</strong><small>{new Date(`${item.effective_date}T00:00:00`).toLocaleDateString("es-ES")} · {transactionLabels[item.transaction_type]}</small></div><b className={item.displayAmount >= 0 ? "positive" : "negative"}>{money(item.displayAmount, item.currency)}</b>{item.transaction_type !== "reversal" && !transactions.some((candidate) => candidate.reversed_transaction_id === item.id) && <button className="icon-action" aria-label={`Revertir ${item.description}`} title="Crear reverso" onClick={() => void reverseTransaction(item.id).then(refresh)}><RotateCcw size={16} /></button>}</article>)}</div> : <EmptyState title="No hay movimientos para estos filtros" action="Añadir movimiento" onClick={() => setDialog("transaction")} />}<div className="pagination"><button disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Anterior</button><span>Página {page + 1}</span><button disabled={(page + 1) * 10 >= count} onClick={() => setPage((value) => value + 1)}>Siguiente</button></div></section>}
      </>}
    </main>
    {dialog && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}><section className="finance-dialog" role="dialog" aria-modal="true" aria-labelledby="finance-dialog-title"><h2 id="finance-dialog-title">{dialog === "account" ? "Nueva cuenta" : "Nuevo movimiento"}</h2>{dialog === "account" ? <AccountForm currency={defaultCurrency} busy={busy} onSubmit={submitAccount} onCancel={() => setDialog(null)} /> : <TransactionForm accounts={activeAccounts} busy={busy} onSubmit={submitTransaction} onCancel={() => setDialog(null)} />}</section></div>}
  </>;
}

function EmptyState({ title, action, onClick }: { title: string; action: string; onClick: () => void }) { return <div className="empty-state"><WalletCards size={28} /><h2>{title}</h2><button className="secondary-button" onClick={onClick}>{action}</button></div>; }

function AccountForm({ currency, busy, onSubmit, onCancel }: { currency: string; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) { return <form className="finance-form" onSubmit={onSubmit}><label>Nombre<input name="name" maxLength={100} required autoFocus placeholder="Cuenta principal" /></label><label>Tipo<select name="type" defaultValue="bank">{Object.entries(accountLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Moneda<input name="currency" defaultValue={currency} pattern="[A-Z]{3}" maxLength={3} required /></label><div className="dialog-actions"><button type="button" className="text-button" onClick={onCancel}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Crear cuenta"}</button></div></form>; }

function TransactionForm({ accounts, busy, onSubmit, onCancel }: { accounts: FinancialAccount[]; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) { const [type, setType] = useState<Exclude<TransactionType, "reversal">>("expense"); const [sourceId, setSourceId] = useState(accounts[0]?.id ?? ""); const source = accounts.find((item) => item.id === sourceId); const destinations = accounts.filter((item) => item.id !== sourceId && item.currency_code === source?.currency_code); return <form className="finance-form" onSubmit={onSubmit}><label>Tipo<select name="type" value={type} onChange={(event) => setType(event.target.value as Exclude<TransactionType, "reversal">)}><option value="expense">Gasto</option><option value="income">Ingreso</option><option value="transfer">Transferencia</option><option value="adjustment">Ajuste</option></select></label><label>Fecha<input type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label>Concepto<input name="description" maxLength={240} required autoFocus placeholder="Ej. Compra semanal" /></label><label>Importe<input name="amount" type="number" min="0.0001" step="0.0001" required /></label><label>Cuenta<select name="account" value={sourceId} onChange={(event) => setSourceId(event.target.value)} required>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name} · {account.currency_code}</option>)}</select></label>{type === "transfer" && <label>Destino<select name="destination" required>{destinations.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select>{!destinations.length && <small>Necesitas otra cuenta activa en {source?.currency_code}.</small>}</label>}{type === "adjustment" && <label>Dirección<select name="direction"><option value="credit">Aumentar saldo</option><option value="debit">Reducir saldo</option></select></label>}<div className="dialog-actions"><button type="button" className="text-button" onClick={onCancel}>Cancelar</button><button className="primary-button" disabled={busy || (type === "transfer" && !destinations.length)}>{busy ? "Registrando…" : "Registrar"}</button></div></form>; }
