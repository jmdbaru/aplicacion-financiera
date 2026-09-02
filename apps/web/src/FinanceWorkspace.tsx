import {
  Archive,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  CreditCard,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CalendarDays,
  FolderTree,
  Goal,
  Home,
  HandCoins,
  Landmark,
  LineChart,
  Menu,
  PieChart,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  Wallet,
  WalletCards,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
import { CurrencySelector } from "./CatalogSelectors";
import { useCurrencyCatalog } from "./catalogs";
import { CalendarWorkspace } from "./CalendarWorkspace";
import { LoadingState } from "./LoadingState";
import { loadTransactionLibrary, saveTransactionLibraryItem, type TransactionLibraryItem } from "./transactionLibrary";
import { CommandPalette, type CommandItem } from "./CommandPalette";
import { type Profile } from "./supabase";
import { loadCategories, type Category } from "./budgets";
import {
  createAccount,
  deleteAccount,
  createTransaction,
  loadAccounts,
  loadAccountTransactions,
  loadTransactions,
  reverseTransaction,
  setAccountActive,
  type AccountColor,
  type AccountType,
  type FinancialAccount,
  type LedgerTransaction,
  type TransactionType,
} from "./finance";

type View = "summary" | "accounts" | "account-detail" | "transactions" | "categories" | "budgets" | "recurring" | "goals" | "wealth" | "reports" | "imports" | "investments" | "split" | "calendar";
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
    // Importación temporalmente desactivada hasta completar su revisión funcional.
  ] },
  { id: "planificacion", label: "Planificación", items: [
    { view: "budgets", label: "Presupuestos", helper: "Límites mensuales", icon: CircleDollarSign },
    { view: "categories", label: "Categorías", helper: "Taxonomía", icon: FolderTree },
    { view: "goals", label: "Objetivos", helper: "Metas y aportes", icon: Goal },
    { view: "recurring", label: "Recurrentes", helper: "Automatización", icon: RotateCcw },
    { view: "calendar", label: "Calendario", helper: "Operaciones diarias", icon: CalendarDays },
  ] },
  { id: "analisis", label: "Análisis", items: [
    { view: "reports", label: "Informes", helper: "Tendencias", icon: PieChart },
    // Patrimonio e Inversiones se mantienen preparados, pero permanecen ocultos hasta su siguiente fase.
    { view: "split", label: "Repartos", helper: "Viajes y eventos", icon: HandCoins },
  ] },
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

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function weekStart(date = new Date()) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return localDateKey(result);
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

function isoWeekValue(value: string) {
  const date = new Date(`${value}T00:00:00`);
  const thursday = new Date(date);
  thursday.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  const week = 1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  return `${thursday.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function startFromIsoWeek(value: string) {
  const [yearText, weekText] = value.split("-W");
  const year = Number(yearText), week = Number(weekText);
  const januaryFourth = new Date(year, 0, 4);
  const monday = new Date(year, 0, 4 - ((januaryFourth.getDay() + 6) % 7) + (week - 1) * 7);
  return localDateKey(monday);
}

export function FinanceWorkspace({ session, defaultCurrency, profile, onProfileSaved, onSignOut }: { session: Session; defaultCurrency: string; profile: Profile | null; onProfileSaved: (profile: Profile) => void; onSignOut: () => void }) {
  const reduceMotion = useReducedMotion();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [view, setView] = useState<View>("summary");
  const [dialog, setDialog] = useState<"account" | "transaction" | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null);
  const [selectedAccountTransactions, setSelectedAccountTransactions] = useState<LedgerTransaction[]>([]);
  const [accountDetailLoading, setAccountDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [accountNotice, setAccountNotice] = useState("");
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(() => weekStart());
  const [dateTo, setDateTo] = useState(() => shiftDate(weekStart(), 6));
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<"" | TransactionType>("");
  const [transactionCategoryFilter, setTransactionCategoryFilter] = useState("");
  const [transactionCurrencyFilter, setTransactionCurrencyFilter] = useState("");
  const [transactionAccountFilter, setTransactionAccountFilter] = useState("");
  const [transactionSubcategoryFilter, setTransactionSubcategoryFilter] = useState("");
  const [transactionPanel, setTransactionPanel] = useState<"movements" | "library">("movements");
  const [libraryType, setLibraryType] = useState<"expense" | "income">("expense");
  const [libraryPage, setLibraryPage] = useState(0);
  const [libraryItems, setLibraryItems] = useState<TransactionLibraryItem[]>([]);
  const [libraryCount, setLibraryCount] = useState(0);
  const [transactionPreset, setTransactionPreset] = useState<TransactionLibraryItem | null>(null);
  const [transactionDialogPanel, setTransactionDialogPanel] = useState<"form" | "library">("form");
  const [movementFiltersOpen, setMovementFiltersOpen] = useState(false);
  const [accountFiltersOpen, setAccountFiltersOpen] = useState(false);
  const [accountOrder, setAccountOrder] = useState<"name" | "balance" | "type">("name");
  const [accountTypeFilter, setAccountTypeFilter] = useState<"" | AccountType>("");
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
        loadTransactions(session, page, { search, dateFrom, dateTo, type: transactionTypeFilter, categoryId: transactionCategoryFilter, subcategoryId: transactionSubcategoryFilter, currencyCode: transactionCurrencyFilter, accountId: transactionAccountFilter }),
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
  }, [session, page, search, dateFrom, dateTo, transactionTypeFilter, transactionCategoryFilter, transactionSubcategoryFilter, transactionCurrencyFilter, transactionAccountFilter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const mainLibraryOpen = view === "transactions" && transactionPanel === "library";
    const dialogLibraryOpen = dialog === "transaction" && transactionDialogPanel === "library";
    if (!mainLibraryOpen && !dialogLibraryOpen) return;
    void loadTransactionLibrary(session, libraryType, libraryPage).then((result) => { setLibraryItems(result.rows); setLibraryCount(result.count); }).catch(() => setError("No se pudo cargar la biblioteca."));
  }, [session, view, transactionPanel, dialog, transactionDialogPanel, libraryType, libraryPage]);
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
      } else if (!event.ctrlKey && !event.metaKey && event.key.toLowerCase() === "n" && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLSelectElement)) {
        event.preventDefault();
        setTransactionPreset(null);
        setDialog(accounts.some((account) => account.is_active) ? "transaction" : "account");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [accounts]);

  const activeAccounts = accounts.filter((account) => account.is_active);
  const dashboardCurrencies = useMemo(() => {
    const currencies = [...new Set(activeAccounts.map((account) => account.currency_code))];
    return currencies.length ? currencies : [defaultCurrency];
  }, [activeAccounts, defaultCurrency]);
  const effectiveDashboardCurrency = dashboardCurrencies.includes(dashboardCurrency) ? dashboardCurrency : dashboardCurrencies[0];
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
  const filteredMovements = movements;
  const orderedAccounts = useMemo(() => accounts.filter((account) => !accountTypeFilter || account.account_type === accountTypeFilter).sort((left, right) => accountOrder === "balance" ? right.balance - left.balance : accountOrder === "type" ? left.account_type.localeCompare(right.account_type) : left.name.localeCompare(right.name)), [accounts, accountOrder, accountTypeFilter]);

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
        card_color: String(form.get("color") || "emerald") as AccountColor,
      });
      setDialog(null);
      await refresh();
    }, "No se pudo crear la cuenta.");
  }

  function openAccountDetail(account: FinancialAccount) {
    setSelectedAccount(account);
    setSelectedAccountTransactions([]);
    setAccountDetailLoading(true);
    setView("account-detail");
    void loadAccountTransactions(session, account.id)
      .then(setSelectedAccountTransactions)
      .catch(() => setError("No se pudo cargar el historial de esta cuenta."))
      .finally(() => setAccountDetailLoading(false));
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
      if (form.get("save-to-library") === "on" && (form.get("type") === "expense" || form.get("type") === "income")) {
        await saveTransactionLibraryItem(session, {
          description: String(form.get("description")),
          transaction_type: String(form.get("type")) as "expense" | "income",
          category_id: String(form.get("category") || "") || null,
          default_amount: Number(form.get("amount")) || null,
        });
      }
      setTransactionPreset(null);
      setDialog(null);
      await refresh();
    }, "No se pudo registrar el movimiento.");
  }

  const currentView = view === "account-detail" ? { label: "Cuenta" } : viewMeta[view];
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
    <main id="main-content" className="main-content">{(view === "transactions" || view === "calendar") && <button className="floating-create" type="button" aria-keyshortcuts="N" aria-label={activeAccounts.length ? "Añadir movimiento" : "Crear cuenta"} title={activeAccounts.length ? "Nuevo movimiento · tecla N" : "Crear cuenta"} onClick={() => { setTransactionPreset(null); setTransactionDialogPanel("form"); setDialog(activeAccounts.length ? "transaction" : "account"); }}><Plus size={25} /><span className="sr-only">{activeAccounts.length ? "Movimiento" : "Cuenta"}</span></button>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {loading ? <LoadingState /> : <AnimatePresence mode="wait" initial={false}><motion.div className="workspace-stage" key={view} initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -3 }} transition={{ duration: 0.16, ease: "easeOut" }}>
        {view === "summary" && <DashboardWorkspace currency={effectiveDashboardCurrency} currencyControl={dashboardCurrencies.length > 1 ? <DashboardCurrencyToggle currency={effectiveDashboardCurrency} currencies={dashboardCurrencies} onChange={setDashboardCurrency} /> : undefined} onCreateAccount={() => setDialog("account")} />}
        {view === "accounts" && <section className="managed-workspace"><div className="workspace-actionbar"><button className="secondary-button" type="button" aria-expanded={accountFiltersOpen} onClick={() => setAccountFiltersOpen((value) => !value)}><SlidersHorizontal size={16} /> {accountFiltersOpen ? "Ocultar filtros" : "Filtrar y ordenar"}</button><button className="primary-button" onClick={() => setDialog("account")}><Plus size={18} /> Nueva cuenta</button></div>{accountFiltersOpen && <div className="quick-filters filter-reveal"><span>Ver:</span><select aria-label="Filtrar tipo de cuenta" value={accountTypeFilter} onChange={(event) => setAccountTypeFilter(event.target.value as "" | AccountType)}><option value="">Todas las categorías</option>{Object.entries(accountLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><span>Ordenar por:</span><select value={accountOrder} onChange={(event) => setAccountOrder(event.target.value as "name" | "balance" | "type")}><option value="name">Nombre</option><option value="balance">Saldo</option><option value="type">Tipo</option></select></div>}{accountNotice && <p className="account-toast" role="status">{accountNotice}</p>}<AccountsView accounts={orderedAccounts} busy={busy} onCreate={() => setDialog("account")} onOpen={openAccountDetail} onToggle={(account) => void runAction(async () => { await setAccountActive(session, account.id, !account.is_active); await refresh(); }, "No se pudo cambiar el estado de la cuenta.")} onDelete={(account) => void (async () => { try { await deleteAccount(session, account.id); await refresh(); } catch { setAccountNotice("No podemos borrar esta cuenta porque conserva operaciones o configuraciones vinculadas. Puedes archivarla para mantener tu historial."); window.setTimeout(() => setAccountNotice(""), 1000); } })()} /></section>}
        {view === "account-detail" && selectedAccount && <AccountDetail account={selectedAccount} movements={selectedAccountTransactions} loading={accountDetailLoading} onClose={() => setView("accounts")} />}
        {view === "transactions" && <section className="transactions-workspace"><div className="workspace-toggle workspace-toggle--view" role="tablist" aria-label="Contenido de movimientos"><button type="button" role="tab" aria-selected={transactionPanel === "movements"} className={transactionPanel === "movements" ? "is-active" : ""} onClick={() => setTransactionPanel("movements")}>Movimientos</button><button type="button" role="tab" aria-selected={transactionPanel === "library"} className={transactionPanel === "library" ? "is-active" : ""} onClick={() => setTransactionPanel("library")}>Biblioteca</button></div>{transactionPanel === "movements" ? <>{movementFiltersOpen&&<div className="filter-reveal"><QuickTransactionFilters categories={activeCategories} accounts={activeAccounts} type={transactionTypeFilter} category={transactionCategoryFilter} subcategory={transactionSubcategoryFilter} currency={transactionCurrencyFilter} account={transactionAccountFilter} onType={(value) => { setTransactionTypeFilter(value); setPage(0); }} onCategory={(value) => { setTransactionCategoryFilter(value); setTransactionSubcategoryFilter(""); setPage(0); }} onSubcategory={(value) => { setTransactionSubcategoryFilter(value); setPage(0); }} onCurrency={(value) => { setTransactionCurrencyFilter(value); setPage(0); }} onAccount={(value) => { setTransactionAccountFilter(value); setPage(0); }} /></div>}<TransactionsView movements={filteredMovements} transactions={transactions} count={count} page={page} search={search} weekStart={dateFrom} filtersOpen={movementFiltersOpen} categoryNames={categoryNames} accountNames={new Map(accounts.map((account) => [account.id, account.name]))} canCreate={Boolean(activeAccounts.length)} onCreate={() => { setTransactionPreset(null); setTransactionDialogPanel("form"); setDialog(activeAccounts.length ? "transaction" : "account"); }} onToggleFilters={() => setMovementFiltersOpen((value)=>!value)} onSearch={(value) => { setSearch(value); setPage(0); }} onWeek={(value) => { const start = startFromIsoWeek(value); setDateFrom(start); setDateTo(shiftDate(start, 6)); setPage(0); }} onShiftWeek={(days) => { setDateFrom((current) => shiftDate(current, days)); setDateTo((current) => shiftDate(current, days)); setPage(0); }} onPage={setPage} onReverse={(id) => void runAction(async () => { await reverseTransaction(id); await refresh(); }, "No se pudo revertir el movimiento.")} /></> : <TransactionLibraryView items={libraryItems} count={libraryCount} page={libraryPage} type={libraryType} categoryNames={categoryNames} onType={(value) => { setLibraryType(value); setLibraryPage(0); }} onPage={setLibraryPage} onUse={(item) => { setTransactionPreset(item); setTransactionDialogPanel("form"); setDialog("transaction"); }} />}</section>}
        {(view === "categories" || view === "budgets") && <BudgetWorkspace session={session} currency={defaultCurrency} categories={categories} mode={view} onCategoriesChanged={refreshCategories} />}
        {view === "recurring" && <RecurringWorkspace session={session} accounts={accounts} categories={activeCategories} currency={defaultCurrency} />}
        {view === "goals" && <GoalsWorkspace session={session} currency={defaultCurrency} />}
        {view === "wealth" && <WealthWorkspace session={session} currency={defaultCurrency} />}
        {view === "reports" && <ReportsWorkspace currency={defaultCurrency} />}
        {view === "imports" && <ImportsWorkspace session={session} accounts={accounts} categories={categories} currency={defaultCurrency} onImported={refresh} />}
        {view === "investments" && <InvestmentsWorkspace session={session} accounts={accounts} currency={defaultCurrency} />}
        {view === "split" && <SplitWorkspace session={session} currency={defaultCurrency} />}
        {view === "calendar" && <CalendarWorkspace session={session} currency={defaultCurrency} accounts={accounts} />}
      </motion.div></AnimatePresence>}
    </main>
    {dialog && <ModalFrame title={dialog === "account" ? "Nueva cuenta" : transactionDialogPanel === "library" ? "Elegir de la biblioteca" : "Nuevo movimiento"} onClose={() => { setTransactionPreset(null); setTransactionDialogPanel("form"); setDialog(null); }} labelledBy="finance-dialog-title">{dialog === "account" ? <AccountForm currency={defaultCurrency} busy={busy} onSubmit={submitAccount} onCancel={() => setDialog(null)} /> : transactionDialogPanel === "library" ? <TransactionLibraryPicker items={libraryItems} count={libraryCount} page={libraryPage} type={libraryType} categoryNames={categoryNames} onBack={() => setTransactionDialogPanel("form")} onType={(value) => { setLibraryType(value); setLibraryPage(0); }} onPage={setLibraryPage} onUse={(item) => { setTransactionPreset(item); setTransactionDialogPanel("form"); }} /> : <TransactionForm key={transactionPreset?.id ?? "new"} accounts={activeAccounts} categories={activeCategories} busy={busy} preset={transactionPreset} onOpenLibrary={() => setTransactionDialogPanel("library")} onSubmit={submitTransaction} onCancel={() => { setTransactionPreset(null); setTransactionDialogPanel("form"); setDialog(null); }} />}</ModalFrame>}
    {commandPaletteOpen && <CommandPalette items={commandItems} onClose={() => setCommandPaletteOpen(false)} />}
    </div>
  </div>;
}

function NavItem({ item, active, onClick }: { item: NavigationGroup["items"][number]; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return <button className={`nav-link nav-link--stacked ${active ? "is-active" : ""}`} type="button" aria-current={active ? "page" : undefined} title={`${item.label}: ${item.helper}`} onClick={onClick}><Icon aria-hidden="true" size={19} /><span><strong>{item.label}</strong><small>{item.helper}</small></span></button>;
}

function DashboardCurrencyToggle({ currency, currencies, onChange }: { currency: string; currencies: string[]; onChange: (value: string) => void }) {
  const { data: catalog = [] } = useCurrencyCatalog();
  const label = (item: string) => { const data = catalog.find((entry) => entry.code === item); return data ? `${data.symbol} · ${data.code}` : item; };
  return <div className="dashboard-currency-toggle" aria-label="Moneda del resumen">{currencies.length <= 2 ? currencies.map((item) => <button key={item} type="button" className={item === currency ? "is-active" : ""} onClick={() => onChange(item)}>{label(item)}</button>) : <select value={currency} onChange={(event) => onChange(event.target.value)} aria-label="Seleccionar moneda">{currencies.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select>}</div>;
}

function AccountsView({ accounts, busy, onCreate, onOpen, onToggle, onDelete }: { accounts: FinancialAccount[]; busy: boolean; onCreate: () => void; onOpen: (account: FinancialAccount) => void; onToggle: (account: FinancialAccount) => void; onDelete: (account: FinancialAccount) => void }) {
  const groups = (["cash", "bank", "credit_card", "investment", "loan", "other"] as AccountType[]).map((type) => ({ type, accounts: accounts.filter((account) => account.account_type === type) })).filter((group) => group.accounts.length);
  return <div className="managed-workspace-content"><div className="section-heading"><div><p className="eyebrow">CUENTAS</p><h1>Tus cuentas</h1></div></div>{groups.length ? <div className="account-groups">{groups.map((group) => <section className="account-group" key={group.type}><div className="account-group-heading"><AccountVisual type={group.type} /><h2>{accountLabels[group.type]}</h2><span>{group.accounts.length}</span></div><div className={`account-grid account-grid--${group.type}`}>{group.accounts.map((account) => <article className={`account-card account-card--${account.account_type} account-card--${account.card_color} ${account.is_active ? "" : "is-archived"}`} key={account.id}><AccountVisual type={account.account_type} /><div><span>{accountLabels[account.account_type]}</span><h3>{account.name}</h3></div><strong>{money(account.balance, account.currency_code)}</strong><div className="account-card-bottom"><div className="account-card-actions"><button className="text-button" type="button" onClick={() => onOpen(account)}>Ver detalle</button><button className="text-button" disabled={busy} onClick={() => onToggle(account)}>{account.is_active ? <Archive size={15} /> : "Restaurar"}</button><button className="icon-action account-delete" type="button" disabled={busy} aria-label={`Borrar ${account.name}`} title="Borrar cuenta" onClick={() => onDelete(account)}><Trash2 size={15} /></button></div></div></article>)}</div></section>)}</div> : <EmptyState title="Aún no hay cuentas" action="Crear la primera" onClick={onCreate} />}</div>;
}

function AccountVisual({ type }: { type: FinancialAccount["account_type"] }) {
  const Icon = type === "cash" ? Banknote : type === "credit_card" ? CreditCard : type === "investment" ? LineChart : type === "loan" ? HandCoins : type === "bank" ? Landmark : Wallet;
  return <span className="account-card-visual" aria-hidden="true"><Icon size={22} /></span>;
}

function AccountDetail({ account, movements, loading, onClose }: { account: FinancialAccount; movements: LedgerTransaction[]; loading: boolean; onClose: () => void }) {
  return <section className="account-detail"><div className="section-heading"><div><p className="eyebrow">CUENTAS · DETALLE</p><h1>{account.name}</h1></div><button type="button" className="text-button" onClick={onClose}><ArrowDownLeft size={16} /> Volver a cuentas</button></div><div className={`account-detail-summary account-card--${account.account_type} account-card--${account.card_color}`}><AccountVisual type={account.account_type} /><div><span>{accountLabels[account.account_type]} · {account.currency_code}</span><strong>{money(account.balance, account.currency_code)}</strong></div></div><div className="account-detail-heading"><div><p className="eyebrow">HISTORIAL</p><h3>Movimientos de esta cuenta</h3></div><span>{loading ? "Cargando…" : `${movements.length} últimos movimientos`}</span></div>{loading ? <LoadingState /> : movements.length ? <div className="account-detail-list">{movements.map((movement) => { const entry = movement.ledger_entries.find((item) => item.account_id === account.id); return <div key={movement.id}><div><strong>{movement.description}</strong><small>{new Date(`${movement.effective_date}T00:00:00`).toLocaleDateString("es-ES")} · {transactionLabels[movement.transaction_type]}</small></div><b className={Number(entry?.amount ?? 0) >= 0 ? "positive" : "negative"}>{money(Number(entry?.amount ?? 0), entry?.currency_code ?? account.currency_code)}</b></div>; })}</div> : <p className="ux-hint">Esta cuenta todavía no tiene movimientos.</p>}</section>;
}

type Movement = LedgerTransaction & { displayAmount: number; currency: string };

function TransactionLibraryView({ items, count, page, type, categoryNames, onType, onPage, onUse }: { items: TransactionLibraryItem[]; count: number; page: number; type: "expense" | "income"; categoryNames: Map<string, string>; onType: (value: "expense" | "income") => void; onPage: (value: number | ((current: number) => number)) => void; onUse: (item: TransactionLibraryItem) => void }) {
  return <section><div className="section-heading"><div><p className="eyebrow">BIBLIOTECA</p><h1>Gastos e ingresos guardados</h1><p className="section-copy">Reutiliza conceptos frecuentes al registrar un movimiento.</p></div><div className="workspace-toggle workspace-toggle--inner" role="tablist"><button type="button" className={type === "expense" ? "is-active" : ""} onClick={() => onType("expense")}>Gastos</button><button type="button" className={type === "income" ? "is-active" : ""} onClick={() => onType("income")}>Ingresos</button></div></div>{items.length ? <div className="transaction-library-list">{items.map((item) => <article key={item.id}><div><strong>{item.description}</strong><small>{item.category_id ? categoryNames.get(item.category_id) ?? "Categoría archivada" : "Sin categoría"}</small></div><b>{item.default_amount ? new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.default_amount) : "Importe libre"}</b><button type="button" className="secondary-button" onClick={() => onUse(item)}>Usar</button></article>)}</div> : <div className="empty-state"><WalletCards size={28}/><h2>No hay {type === "expense" ? "gastos" : "ingresos"} guardados</h2><p>Al crear un movimiento, marca la opción para añadirlo aquí.</p></div>}<div className="pagination"><button disabled={page === 0} onClick={() => onPage((value) => value - 1)}>Anterior</button><span>Página {page + 1}</span><button disabled={(page + 1) * 10 >= count} onClick={() => onPage((value) => value + 1)}>Siguiente</button></div></section>;
}

function QuickTransactionFilters({ categories, accounts, type, category, subcategory, currency, account, onType, onCategory, onSubcategory, onCurrency, onAccount }: { categories: Category[]; accounts: FinancialAccount[]; type: "" | TransactionType; category: string; subcategory: string; currency: string; account: string; onType: (value: "" | TransactionType) => void; onCategory: (value: string) => void; onSubcategory: (value: string) => void; onCurrency: (value: string) => void; onAccount: (value: string) => void }) {
  const rootCategories = categories.filter((item) => !item.parent_id && (!type || item.type === type || item.type === "both"));
  const subcategories = categories.filter((item) => item.parent_id === category);
  const currencies = [...new Set(accounts.map((item) => item.currency_code))].sort();
  const hasFilters = type || category || subcategory || currency || account;
  return <div className="quick-filters" aria-label="Filtros rápidos"><span>Filtrar:</span><select value={type} aria-label="Tipo de movimiento" onChange={(event) => onType(event.target.value as "" | TransactionType)}><option value="">Todos</option><option value="expense">Gastos</option><option value="income">Ingresos</option><option value="transfer">Transferencias</option><option value="adjustment">Ajustes</option></select><select value={currency} aria-label="Moneda" onChange={(event) => onCurrency(event.target.value)}><option value="">Todas las monedas</option>{currencies.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={account} aria-label="Cuenta" onChange={(event) => onAccount(event.target.value)}><option value="">Todas las cuentas</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.currency_code}</option>)}</select><select value={category} aria-label="Categoría" onChange={(event) => onCategory(event.target.value)}><option value="">Todas las categorías</option>{rootCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={subcategory} aria-label="Subcategoría" disabled={!category || !subcategories.length} onChange={(event) => onSubcategory(event.target.value)}><option value="">{category && !subcategories.length ? "Sin subcategorías" : "Todas las subcategorías"}</option>{subcategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{hasFilters && <button className="text-button" type="button" onClick={() => { onType(""); onCategory(""); onSubcategory(""); onCurrency(""); onAccount(""); }}>Limpiar</button>}</div>;
}

function TransactionsView({ movements, transactions, count, page, search, weekStart: selectedWeekStart, filtersOpen, categoryNames, accountNames, canCreate, onCreate, onToggleFilters, onSearch, onWeek, onShiftWeek, onPage, onReverse }: { movements: Movement[]; transactions: LedgerTransaction[]; count: number; page: number; search: string; weekStart: string; filtersOpen: boolean; categoryNames: Map<string, string>; accountNames: Map<string, string>; canCreate: boolean; onCreate: () => void; onToggleFilters: () => void; onSearch: (value: string) => void; onWeek: (value: string) => void; onShiftWeek: (days: number) => void; onPage: (value: number | ((current: number) => number)) => void; onReverse: (id: string) => void }) {
  const accountsFor = (item: Movement) => item.ledger_entries.filter((entry) => entry.entry_kind === "account" && entry.account_id).map((entry) => accountNames.get(entry.account_id ?? "") ?? "Cuenta archivada");
  const accountSummary = (item: Movement) => { const names = accountsFor(item); if (!names.length) return "Cuenta no disponible"; if(item.transaction_type === "transfer")return `${names[0] ?? "Cuenta"} → ${names[1] ?? "Cuenta"}`;return `${item.displayAmount >= 0 ? "Ingresado en" : "Pagado con"}: ${names[0]}`; };
  const activeFilterCount = search ? 1 : 0;
  const weekEnd = shiftDate(selectedWeekStart, 6);
  const weekLabel = `${new Date(`${selectedWeekStart}T00:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} — ${new Date(`${weekEnd}T00:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`;
  return <section><div className="section-heading section-heading--compact"><div><p className="eyebrow">ACTIVIDAD</p><h1>Movimientos</h1></div><div className="movement-heading-actions"><div className="week-selector"><button type="button" aria-label="Semana anterior" onClick={() => onShiftWeek(-7)}><ChevronLeft size={16}/></button><label><span>{weekLabel}</span><input aria-label="Elegir semana" type="week" value={isoWeekValue(selectedWeekStart)} onChange={(event) => onWeek(event.target.value)} /></label><button type="button" aria-label="Semana siguiente" onClick={() => onShiftWeek(7)}><ChevronRight size={16}/></button></div><button className={`secondary-button filter-button ${filtersOpen ? "is-active" : ""}`} type="button" onClick={onToggleFilters}><SlidersHorizontal size={16}/> Filtros{activeFilterCount ? ` · ${activeFilterCount}` : ""}</button></div></div>{!canCreate && <p className="ux-hint">Para registrar movimientos necesitas al menos una cuenta activa.</p>}{filtersOpen&&<div className="filters filters--search filter-reveal"><input aria-label="Buscar movimientos" placeholder="Buscar concepto dentro de la semana" value={search} onChange={(event) => onSearch(event.target.value)} /></div>}{movements.length ? <div className="transaction-list">{movements.map((item,index) => <Fragment key={item.id}>{(index === 0 || movements[index - 1].effective_date !== item.effective_date) && <div className="transaction-date-divider"><span>{new Date(`${item.effective_date}T00:00:00`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</span></div>}<article className={`transaction-row transaction-row--${item.transaction_type}`}><span className={`movement-icon movement-icon--${item.transaction_type}`}>{item.transaction_type === "income" ? <ArrowDownLeft /> : item.transaction_type === "transfer" ? <ArrowLeftRight /> : <ArrowUpRight />}</span><div><strong>{item.description}</strong><small>{transactionLabels[item.transaction_type]} · {item.category_id ? categoryNames.get(item.category_id) ?? "Categoría archivada" : "Sin categoría"}</small><small className="movement-account">{accountSummary(item)}</small></div><b className={item.displayAmount >= 0 ? "positive" : "negative"}>{money(item.displayAmount, item.currency)}</b>{item.transaction_type !== "reversal" && !transactions.some((candidate) => candidate.reversed_transaction_id === item.id) && <button className="icon-action" aria-label={`Revertir ${item.description}`} title="Crear reverso" onClick={() => onReverse(item.id)}><RotateCcw size={16} /></button>}</article></Fragment>)}</div> : <EmptyState title="No hay movimientos en esta semana" action={canCreate ? "Añadir movimiento" : "Crear cuenta primero"} onClick={onCreate} />}<div className="pagination"><button disabled={page === 0} onClick={() => onPage((value) => value - 1)}>Anterior</button><span>Página {page + 1}</span><button disabled={(page + 1) * 10 >= count} onClick={() => onPage((value) => value + 1)}>Siguiente</button></div></section>;
}

function EmptyState({ title, action, onClick }: { title: string; action: string; onClick: () => void }) {
  return <div className="empty-state"><WalletCards size={28} /><h2>{title}</h2><button className="secondary-button" onClick={onClick}>{action}</button></div>;
}

function AccountForm({ currency, busy, onSubmit, onCancel }: { currency: string; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const [type, setType] = useState<AccountType>("bank");
  const canChooseColor = type === "bank" || type === "credit_card";
  return <form className="finance-form" onSubmit={onSubmit}><label>Nombre<input name="name" maxLength={100} required autoFocus placeholder="Cuenta principal" /></label><label>Tipo<select name="type" value={type} onChange={(event) => setType(event.target.value as AccountType)}>{Object.entries(accountLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Moneda<CurrencySelector value={currency} /></label>{canChooseColor && <label>Color de {type === "bank" ? "la cuenta" : "la tarjeta"}<select name="color" defaultValue="emerald"><option value="emerald">Verde</option><option value="blue">Azul</option><option value="violet">Violeta</option><option value="rose">Rosa</option></select></label>}<div className="dialog-actions"><button type="button" className="text-button" onClick={onCancel}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Crear cuenta"}</button></div></form>;
}

function TransactionLibraryPicker({ items, count, page, type, categoryNames, onBack, onType, onPage, onUse }: { items: TransactionLibraryItem[]; count: number; page: number; type: "expense" | "income"; categoryNames: Map<string, string>; onBack: () => void; onType: (value: "expense" | "income") => void; onPage: (value: number | ((current: number) => number)) => void; onUse: (item: TransactionLibraryItem) => void }) {
  return <div className="transaction-library-picker"><div className="library-picker-toolbar"><button className="text-button" type="button" onClick={onBack}><ArrowDownLeft size={15} /> Volver al formulario</button><div className="workspace-toggle workspace-toggle--inner"><button type="button" className={type === "expense" ? "is-active" : ""} onClick={() => onType("expense")}>Gastos</button><button type="button" className={type === "income" ? "is-active" : ""} onClick={() => onType("income")}>Ingresos</button></div></div><p className="section-copy">Selecciona una plantilla; después podrás cambiar el importe antes de registrarla.</p>{items.length ? <div className="transaction-library-list transaction-library-list--picker">{items.map((item) => <button type="button" key={item.id} onClick={() => onUse(item)}><span><strong>{item.description}</strong><small>{item.category_id ? categoryNames.get(item.category_id) ?? "Categoría archivada" : "Sin categoría"}</small></span><b>{item.default_amount ? new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.default_amount) : "Importe libre"}</b></button>)}</div> : <p className="ux-hint">No tienes plantillas guardadas de este tipo.</p>}<div className="pagination"><button type="button" disabled={page === 0} onClick={() => onPage((value) => value - 1)}>Anterior</button><span>Página {page + 1}</span><button type="button" disabled={(page + 1) * 10 >= count} onClick={() => onPage((value) => value + 1)}>Siguiente</button></div></div>;
}

function TransactionForm({ accounts, categories, busy, preset, onOpenLibrary, onSubmit, onCancel }: { accounts: FinancialAccount[]; categories: Category[]; busy: boolean; preset: TransactionLibraryItem | null; onOpenLibrary: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const [type, setType] = useState<Exclude<TransactionType, "reversal">>(preset?.transaction_type ?? "expense");
  const [sourceId, setSourceId] = useState(() => { const remembered=window.localStorage.getItem("financiera.last-account"); return accounts.some((item)=>item.id===remembered) ? remembered! : accounts[0]?.id ?? ""; });
  const source = accounts.find((item) => item.id === sourceId);
  const destinations = accounts.filter((item) => item.id !== sourceId && item.currency_code === source?.currency_code);
  const validCategories = categories.filter((category) => category.type === type || category.type === "both");
  return <form className="finance-form quick-movement-form" onSubmit={onSubmit}><input type="hidden" name="type" value={type}/><div className="movement-form-toolbar"><span>{preset ? `Plantilla: ${preset.description}` : "Registro rápido"}</span><button className="secondary-button" type="button" onClick={onOpenLibrary}><WalletCards size={16} /> Elegir de biblioteca</button></div><div className="movement-type-picker" role="group" aria-label="Tipo de movimiento">{(["expense","income","transfer","adjustment"] as const).map((value)=><button key={value} type="button" className={type===value?"is-active":""} onClick={()=>setType(value)}>{transactionLabels[value]}</button>)}</div><label>Concepto<input name="description" maxLength={240} required autoFocus defaultValue={preset?.description ?? ""} placeholder="¿Qué movimiento quieres registrar?" /></label><label>Importe<input name="amount" type="number" min="0.0001" step="0.0001" inputMode="decimal" defaultValue={preset?.default_amount ?? ""} required /></label><label>Cuenta<select name="account" value={sourceId} onChange={(event) => {setSourceId(event.target.value);window.localStorage.setItem("financiera.last-account",event.target.value);}} required>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name} · {account.currency_code}</option>)}</select></label><label>Fecha<input type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>{(type === "expense" || type === "income") && <label>Categoría<select name="category" defaultValue={preset?.category_id ?? ""}><option value="">Sin categoría</option>{validCategories.map((category) => <option value={category.id} key={category.id}>{category.parent_id ? "↳ " : ""}{category.name}</option>)}</select></label>}{type === "transfer" && <label>Destino<select name="destination" required>{destinations.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select>{!destinations.length && <small>Necesitas otra cuenta activa en {source?.currency_code}.</small>}</label>}{type === "adjustment" && <label>Dirección<select name="direction"><option value="credit">Aumentar saldo</option><option value="debit">Reducir saldo</option></select></label>}{(type === "expense" || type === "income") && <label className="checkbox-field"><input type="checkbox" name="save-to-library" />Guardar en mi biblioteca para reutilizarlo</label>}<div className="dialog-actions"><button type="button" className="text-button" onClick={onCancel}>Cancelar</button><button className="primary-button" disabled={busy || (type === "transfer" && !destinations.length)}>{busy ? "Registrando…" : "Registrar movimiento"}</button></div></form>;
}
