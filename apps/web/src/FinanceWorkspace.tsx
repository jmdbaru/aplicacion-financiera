import {
  Archive,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  CircleDollarSign,
  CalendarDays,
  FolderTree,
  Goal,
  Home,
  Import,
  HandCoins,
  Landmark,
  LineChart,
  Menu,
  PieChart,
  Plus,
  RotateCcw,
  Trash2,
  Wallet,
  WalletCards,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { BudgetWorkspace } from "./BudgetWorkspace";
import { DashboardWorkspace } from "./DashboardWorkspace";
import { RecurringWorkspace } from "./RecurringWorkspace";
import { GoalsWorkspace } from "./GoalsWorkspace";
import { WealthWorkspace } from "./WealthWorkspace";
import { ReportsWorkspace } from "./ReportsWorkspace";
import { UserMenu } from "./UserMenu";
import { ModalFrame } from "./ModalFrame";
import { ImportsWorkspace } from "./ImportsWorkspace";
import { InvestmentsWorkspace } from "./InvestmentsWorkspace";
import { SplitWorkspace } from "./SplitWorkspace";
import { CalendarWorkspace } from "./CalendarWorkspace";
import { LoadingState } from "./LoadingState";
import { CommandPalette, type CommandItem } from "./CommandPalette";
import { type Profile } from "./supabase";
import { loadCategories, type Category } from "./budgets";
import {
  createAccount,
  deleteAccount,
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

type View = "summary" | "accounts" | "transactions" | "categories" | "budgets" | "recurring" | "goals" | "wealth" | "reports" | "imports" | "investments" | "split" | "calendar";
type NavigationGroup = {
  id: "principal" | "dinero" | "planificacion" | "analisis" | "sistema";
  label: string;
  items: Array<{ view: View; label: string; helper: string; icon: typeof Home }>;
};

const navigationGroups: NavigationGroup[] = [
  { id: "principal", label: "Principal", items: [{ view: "summary", label: "Inicio", helper: "Situación actual", icon: Home }] },
  { id: "dinero", label: "Dinero", items: [
    { view: "transactions", label: "Movimientos", helper: "Ledger y búsqueda", icon: WalletCards },
    { view: "accounts", label: "Cuentas", helper: "Saldos y archivo", icon: Wallet },
    { view: "imports", label: "Importar", helper: "CSV y reglas", icon: Import },
  ] },
  { id: "planificacion", label: "Planificación", items: [
    { view: "budgets", label: "Presupuestos", helper: "Límites mensuales", icon: CircleDollarSign },
    { view: "goals", label: "Objetivos", helper: "Metas y aportes", icon: Goal },
    { view: "recurring", label: "Recurrentes", helper: "Automatización", icon: RotateCcw },
    { view: "calendar", label: "Calendario", helper: "Operaciones diarias", icon: CalendarDays },
  ] },
  { id: "analisis", label: "Análisis", items: [
    { view: "reports", label: "Informes", helper: "Tendencias", icon: PieChart },
    { view: "wealth", label: "Patrimonio", helper: "Activos y pasivos", icon: Landmark },
    { view: "investments", label: "Inversiones", helper: "Carteras", icon: LineChart },
    { view: "split", label: "Repartos", helper: "Viajes y eventos", icon: HandCoins },
  ] },
  { id: "sistema", label: "Sistema", items: [{ view: "categories", label: "Categorías", helper: "Taxonomía", icon: FolderTree }] },
];

const viewMeta = Object.fromEntries(navigationGroups.flatMap((group) => group.items.map((item) => [item.view, { ...item, group: group.label }])) ) as Record<View, NavigationGroup["items"][number] & { group: string }>;

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

export function FinanceWorkspace({ session, defaultCurrency, profile, onProfileSaved, onSignOut }: { session: Session; defaultCurrency: string; profile: Profile | null; onProfileSaved: (profile: Profile) => void; onSignOut: () => void }) {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [view, setView] = useState<View>("summary");
  const [dialog, setDialog] = useState<"account" | "transaction" | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [accountNotice, setAccountNotice] = useState("");
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<"" | TransactionType>("");
  const [transactionCategoryFilter, setTransactionCategoryFilter] = useState("");
  const [accountOrder, setAccountOrder] = useState<"name" | "balance" | "type">("name");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.localStorage.getItem("financiera.sidebar") === "collapsed");
  const [dashboardCurrency, setDashboardCurrency] = useState(defaultCurrency);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<NavigationGroup["id"], boolean>>({
    principal: true,
    dinero: true,
    planificacion: true,
    analisis: true,
    sistema: false,
  });

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
  useEffect(() => {
    window.localStorage.setItem("financiera.sidebar", sidebarCollapsed ? "collapsed" : "expanded");
  }, [sidebarCollapsed]);
  useEffect(() => { document.documentElement.dataset.theme = window.localStorage.getItem("financiera.theme") || "green"; }, []);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setDialog(null);
        setCommandPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeAccounts = accounts.filter((account) => account.is_active);
  const dashboardCurrencies = useMemo(() => [...new Set([defaultCurrency, ...activeAccounts.map((account) => account.currency_code)])], [activeAccounts, defaultCurrency]);
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
  const filteredMovements = useMemo(() => movements.filter((item) => (!transactionTypeFilter || item.transaction_type === transactionTypeFilter) && (!transactionCategoryFilter || item.category_id === transactionCategoryFilter)), [movements, transactionTypeFilter, transactionCategoryFilter]);
  const orderedAccounts = useMemo(() => [...accounts].sort((left, right) => accountOrder === "balance" ? right.balance - left.balance : accountOrder === "type" ? left.account_type.localeCompare(right.account_type) : left.name.localeCompare(right.name)), [accounts, accountOrder]);

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

  const currentView = viewMeta[view];
  const commandItems = useMemo<CommandItem[]>(() => [
    ...navigationGroups.flatMap((group) => group.items.map((item) => ({ id: item.view, label: item.label, helper: item.helper, group: group.label, onSelect: () => { setView(item.view); setMobileSidebarOpen(false); } }))),
    { id: "new-account", label: "Crear cuenta", helper: "Añadir una cuenta financiera", group: "Acciones", onSelect: () => setDialog("account") },
    { id: "new-transaction", label: "Añadir movimiento", helper: activeAccounts.length ? "Registrar ingreso, gasto o transferencia" : "Necesita una cuenta activa", group: "Acciones", onSelect: () => setDialog(activeAccounts.length ? "transaction" : "account") },
  ], [activeAccounts.length]);

  return <div className={`app-shell ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}>
    <a className="skip-link" href="#main-content">Ir al contenido principal</a>
    <aside className={`sidebar ${sidebarCollapsed ? "sidebar--collapsed" : ""} ${mobileSidebarOpen ? "sidebar--open" : ""}`} aria-label="Navegación principal">
      <div className="brand-row"><div className="brand"><span className="brand-mark">F</span><span>Financiera</span></div><button className="icon-action sidebar-close" type="button" aria-label="Cerrar menú" onClick={() => setMobileSidebarOpen(false)}><X size={16} /></button></div>
      <nav className="sidebar-nav">
        {navigationGroups.map((group) => <section className="sidebar-nav-group" key={group.id}>
          <button className="nav-group-title" type="button" aria-expanded={openGroups[group.id]} onClick={() => setOpenGroups((current) => ({ ...current, [group.id]: !current[group.id] }))}><span>{group.label}</span><ChevronDown size={14} /></button>
          {openGroups[group.id] && <div className="nav-group-items">{group.items.map((item) => <NavItem key={item.view} item={item} active={view === item.view} onClick={() => { setView(item.view); setMobileSidebarOpen(false); }} />)}</div>}
        </section>)}
      </nav>
    </aside>
    <div className="content-shell">
    <header className="topbar workspace-topbar">
      <button className="icon-action mobile-menu" type="button" aria-label={sidebarCollapsed ? "Abrir navegación" : "Cerrar navegación"} onClick={() => { if (window.innerWidth <= 760) setMobileSidebarOpen((value) => !value); else setSidebarCollapsed((value) => !value); }}><Menu size={19} /></button>
      <div className="topbar-title"><h1>{currentView.label}</h1></div>
      <div className="topbar-actions"><span className="command-palette-hint" title="Atajo de teclado para buscar"><kbd>Ctrl</kbd><kbd>K</kbd><span>Buscar rápido</span></span><UserMenu session={session} profile={profile} onProfileSaved={onProfileSaved} onSignOut={onSignOut} /></div>
    </header>
    <main id="main-content" className="main-content">{(view === "summary" || view === "calendar") && <button className="floating-create" type="button" aria-label={activeAccounts.length ? "Añadir movimiento" : "Crear cuenta"} title={activeAccounts.length ? "Añadir movimiento" : "Crear cuenta"} onClick={() => setDialog(activeAccounts.length ? "transaction" : "account")}><Plus size={25} /></button>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {loading ? <LoadingState /> : <>
        {view === "summary" && <><DashboardCurrencyToggle currency={dashboardCurrency} currencies={dashboardCurrencies} onChange={setDashboardCurrency} /><DashboardWorkspace currency={dashboardCurrency} onCreateAccount={() => setDialog("account")} /></>}
        {view === "accounts" && <><div className="quick-filters"><span>Ordenar por:</span><select value={accountOrder} onChange={(event) => setAccountOrder(event.target.value as "name" | "balance" | "type")}><option value="name">Nombre</option><option value="balance">Saldo</option><option value="type">Tipo</option></select></div>{accountNotice && <p className="account-toast" role="status">{accountNotice}</p>}<AccountsView accounts={orderedAccounts} busy={busy} onCreate={() => setDialog("account")} onToggle={(account) => void runAction(async () => { await setAccountActive(session, account.id, !account.is_active); await refresh(); }, "No se pudo cambiar el estado de la cuenta.")} onDelete={(account) => void (async () => { try { await deleteAccount(session, account.id); await refresh(); } catch { setAccountNotice("No podemos borrar esta cuenta porque conserva operaciones o configuraciones vinculadas. Puedes archivarla para mantener tu historial."); window.setTimeout(() => setAccountNotice(""), 1000); } })()} /></>}
        {view === "transactions" && <><QuickTransactionFilters categories={activeCategories} type={transactionTypeFilter} category={transactionCategoryFilter} onType={setTransactionTypeFilter} onCategory={setTransactionCategoryFilter} /><TransactionsView movements={filteredMovements} transactions={transactions} count={count} page={page} search={search} dateFrom={dateFrom} dateTo={dateTo} categoryNames={categoryNames} canCreate={Boolean(activeAccounts.length)} onCreate={() => setDialog(activeAccounts.length ? "transaction" : "account")} onSearch={(value) => { setSearch(value); setPage(0); }} onDateFrom={(value) => { setDateFrom(value); setPage(0); }} onDateTo={(value) => { setDateTo(value); setPage(0); }} onPage={setPage} onReverse={(id) => void runAction(async () => { await reverseTransaction(id); await refresh(); }, "No se pudo revertir el movimiento.")} /></>}
        {(view === "categories" || view === "budgets") && <BudgetWorkspace session={session} currency={defaultCurrency} categories={categories} mode={view} onCategoriesChanged={refreshCategories} />}
        {view === "recurring" && <RecurringWorkspace session={session} accounts={accounts} currency={defaultCurrency} />}
        {view === "goals" && <GoalsWorkspace session={session} currency={defaultCurrency} />}
        {view === "wealth" && <WealthWorkspace session={session} currency={defaultCurrency} />}
        {view === "reports" && <ReportsWorkspace currency={defaultCurrency} />}
        {view === "imports" && <ImportsWorkspace session={session} accounts={accounts} categories={categories} currency={defaultCurrency} onImported={refresh} />}
        {view === "investments" && <InvestmentsWorkspace session={session} accounts={accounts} currency={defaultCurrency} />}
        {view === "split" && <SplitWorkspace currency={defaultCurrency} />}
        {view === "calendar" && <CalendarWorkspace session={session} currency={defaultCurrency} />}
      </>}
    </main>
    {dialog && <ModalFrame title={dialog === "account" ? "Nueva cuenta" : "Nuevo movimiento"} onClose={() => setDialog(null)} labelledBy="finance-dialog-title">{dialog === "account" ? <AccountForm currency={defaultCurrency} busy={busy} onSubmit={submitAccount} onCancel={() => setDialog(null)} /> : <TransactionForm accounts={activeAccounts} categories={activeCategories} busy={busy} onSubmit={submitTransaction} onCancel={() => setDialog(null)} />}</ModalFrame>}
    {commandPaletteOpen && <CommandPalette items={commandItems} onClose={() => setCommandPaletteOpen(false)} />}
    </div>
  </div>;
}

function NavItem({ item, active, onClick }: { item: NavigationGroup["items"][number]; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return <button className={`nav-link nav-link--stacked ${active ? "is-active" : ""}`} type="button" aria-current={active ? "page" : undefined} title={`${item.label}: ${item.helper}`} onClick={onClick}><Icon aria-hidden="true" size={19} /><span><strong>{item.label}</strong><small>{item.helper}</small></span></button>;
}

function DashboardCurrencyToggle({ currency, currencies, onChange }: { currency: string; currencies: string[]; onChange: (value: string) => void }) {
  const flag: Record<string, string> = { EUR: "🇪🇺", CZK: "🇨🇿", USD: "🇺🇸", GBP: "🇬🇧", CHF: "🇨🇭", PLN: "🇵🇱", JPY: "🇯🇵", CAD: "🇨🇦", MXN: "🇲🇽" };
  const label = (item: string) => `${flag[item] ?? "🌐"} ${item}`;
  return <div className="dashboard-currency-toggle" aria-label="Moneda del resumen">{currencies.length <= 2 ? currencies.map((item) => <button key={item} type="button" className={item === currency ? "is-active" : ""} onClick={() => onChange(item)}>{label(item)}</button>) : <select value={currency} onChange={(event) => onChange(event.target.value)} aria-label="Seleccionar moneda">{currencies.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select>}</div>;
}

function AccountsView({ accounts, busy, onCreate, onToggle, onDelete }: { accounts: FinancialAccount[]; busy: boolean; onCreate: () => void; onToggle: (account: FinancialAccount) => void; onDelete: (account: FinancialAccount) => void }) {
  return <section><div className="section-heading"><div><p className="eyebrow">CUENTAS</p><h1>Tus cuentas</h1></div><button className="primary-button" onClick={onCreate}><Plus size={18} /> Nueva cuenta</button></div>{accounts.length ? <div className="account-grid">{accounts.map((account) => <article className={`account-card ${account.is_active ? "" : "is-archived"}`} key={account.id}><div><span>{accountLabels[account.account_type]}</span><h2>{account.name}</h2></div><strong>{money(account.balance, account.currency_code)}</strong><div className="account-card-actions"><button className="text-button" disabled={busy} onClick={() => onToggle(account)}>{account.is_active ? <><Archive size={15} /> Archivar</> : "Restaurar"}</button><button className="icon-action account-delete" type="button" disabled={busy} aria-label={`Borrar ${account.name}`} title="Borrar cuenta" onClick={() => onDelete(account)}><Trash2 size={15} /></button></div></article>)}</div> : <EmptyState title="Aún no hay cuentas" action="Crear la primera" onClick={onCreate} />}</section>;
}

type Movement = LedgerTransaction & { displayAmount: number; currency: string };

function QuickTransactionFilters({ categories, type, category, onType, onCategory }: { categories: Category[]; type: "" | TransactionType; category: string; onType: (value: "" | TransactionType) => void; onCategory: (value: string) => void }) {
  return <div className="quick-filters" aria-label="Filtros rápidos"><span>Filtrar:</span><select value={type} onChange={(event) => onType(event.target.value as "" | TransactionType)}><option value="">Todos</option><option value="expense">Gastos</option><option value="income">Ingresos</option><option value="transfer">Transferencias</option><option value="adjustment">Ajustes</option></select><select value={category} onChange={(event) => onCategory(event.target.value)}><option value="">Todas las categorías</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{(type || category) && <button className="text-button" type="button" onClick={() => { onType(""); onCategory(""); }}>Limpiar</button>}</div>;
}

function TransactionsView({ movements, transactions, count, page, search, dateFrom, dateTo, categoryNames, canCreate, onCreate, onSearch, onDateFrom, onDateTo, onPage, onReverse }: { movements: Movement[]; transactions: LedgerTransaction[]; count: number; page: number; search: string; dateFrom: string; dateTo: string; categoryNames: Map<string, string>; canCreate: boolean; onCreate: () => void; onSearch: (value: string) => void; onDateFrom: (value: string) => void; onDateTo: (value: string) => void; onPage: (value: number | ((current: number) => number)) => void; onReverse: (id: string) => void }) {
  return <section><div className="section-heading"><div><p className="eyebrow">LEDGER</p><h1>Movimientos</h1></div><button className="primary-button" onClick={onCreate}><Plus size={18} /> {canCreate ? "Nuevo" : "Crear cuenta primero"}</button></div>{!canCreate && <p className="ux-hint">Para registrar movimientos necesitas al menos una cuenta activa. Te llevamos primero a crearla.</p>}<div className="filters"><input aria-label="Buscar movimientos" placeholder="Buscar concepto" value={search} onChange={(event) => onSearch(event.target.value)} /><input aria-label="Desde" type="date" value={dateFrom} onChange={(event) => onDateFrom(event.target.value)} /><input aria-label="Hasta" type="date" value={dateTo} onChange={(event) => onDateTo(event.target.value)} /></div>{movements.length ? <div className="transaction-list">{movements.map((item) => <article key={item.id}><span className={`movement-icon movement-icon--${item.transaction_type}`}>{item.transaction_type === "income" ? <ArrowDownLeft /> : item.transaction_type === "transfer" ? <ArrowLeftRight /> : <ArrowUpRight />}</span><div><strong>{item.description}</strong><small>{new Date(`${item.effective_date}T00:00:00`).toLocaleDateString("es-ES")} · {transactionLabels[item.transaction_type]} · {item.category_id ? categoryNames.get(item.category_id) ?? "Categoría archivada" : "Sin categoría"}</small></div><b className={item.displayAmount >= 0 ? "positive" : "negative"}>{money(item.displayAmount, item.currency)}</b>{item.transaction_type !== "reversal" && !transactions.some((candidate) => candidate.reversed_transaction_id === item.id) && <button className="icon-action" aria-label={`Revertir ${item.description}`} title="Crear reverso" onClick={() => onReverse(item.id)}><RotateCcw size={16} /></button>}</article>)}</div> : <EmptyState title="No hay movimientos para estos filtros" action={canCreate ? "Añadir movimiento" : "Crear cuenta primero"} onClick={onCreate} />}<div className="pagination"><button disabled={page === 0} onClick={() => onPage((value) => value - 1)}>Anterior</button><span>Página {page + 1}</span><button disabled={(page + 1) * 10 >= count} onClick={() => onPage((value) => value + 1)}>Siguiente</button></div></section>;
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
