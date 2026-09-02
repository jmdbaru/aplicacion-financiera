import {
  AlertTriangle,
  Archive,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import "./budgets.css";
import {
  createBudget,
  createCategory,
  deleteCategory,
  deleteBudget,
  loadBudgetOverview,
  monthStart,
  setCategoryActive,
  shiftMonth,
  updateBudget,
  updateCategory,
  type BudgetOverview,
  type BudgetProgress,
  type Category,
  type CategoryType,
} from "./budgets";
import { ModalFrame } from "./ModalFrame";
import { IconSelector } from "./CatalogSelectors";

type Props = {
  session: Session;
  currency: string;
  categories: Category[];
  mode: "categories" | "budgets";
  onCategoriesChanged: () => Promise<void>;
};

const typeLabels: Record<CategoryType, string> = {
  expense: "Gasto",
  income: "Ingreso",
  both: "Ingreso y gasto",
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value);
}

function monthLabel(period: string) {
  const date = new Date(`${period}T00:00:00`);
  return `${new Intl.DateTimeFormat("es-ES", { month: "long" }).format(date)} ${date.getFullYear()}`;
}

export function BudgetWorkspace({ session, currency, categories, mode, onCategoriesChanged }: Props) {
  const [period, setPeriod] = useState(monthStart());
  const [overview, setOverview] = useState<BudgetOverview | null>(null);
  const [previous, setPrevious] = useState<BudgetOverview | null>(null);
  const [loading, setLoading] = useState(mode === "budgets");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<"category" | "budget" | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingBudget, setEditingBudget] = useState<BudgetProgress | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetProgress | null>(null);

  const refreshBudgets = useCallback(async () => {
    if (mode !== "budgets") return;
    setLoading(true);
    setError("");
    try {
      const [current, prior] = await Promise.all([
        loadBudgetOverview(period, currency),
        loadBudgetOverview(shiftMonth(period, -1), currency),
      ]);
      setOverview(current);
      setPrevious(prior);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar los presupuestos.");
    } finally {
      setLoading(false);
    }
  }, [currency, mode, period]);

  useEffect(() => {
    void refreshBudgets();
  }, [refreshBudgets]);

  const roots = categories.filter((category) => !category.parent_id);
  const availableBudgetCategories = roots.filter(
    (category) =>
      category.is_active &&
      category.type !== "income" &&
      !overview?.items.some((item) => item.category_id === category.id),
  );

  async function run(action: () => Promise<void>, fallback: string) {
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

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(async () => {
      const input = {
        name: String(form.get("name")),
        type: String(form.get("type")) as CategoryType,
        icon: String(form.get("icon")),
        color: String(form.get("color")),
        parent_id: String(form.get("parent") || "") || null,
      };
      if (editingCategory) {
        await updateCategory(session, editingCategory.id, {
          name: input.name,
          icon: input.icon,
          color: input.color,
          parent_id: input.parent_id,
        });
      } else {
        await createCategory(session, input);
      }
      await onCategoriesChanged();
      setDialog(null);
      setEditingCategory(null);
    }, "No se pudo guardar la categoría.");
  }

  async function submitBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(async () => {
      const amount = Number(form.get("amount"));
      const threshold = Number(form.get("threshold"));
      if (editingBudget) {
        await updateBudget(session, editingBudget.id, {
          amount,
          alert_threshold_pct: threshold,
        });
      } else {
        await createBudget(session, {
          category_id: String(form.get("category")),
          period_start: period,
          currency_code: currency,
          amount,
          alert_threshold_pct: threshold,
        });
      }
      await refreshBudgets();
      setDialog(null);
      setEditingBudget(null);
    }, "No se pudo guardar el presupuesto.");
  }

  async function confirmDeleteBudget() {
    if (!deleteTarget) return;
    await run(async () => {
      await deleteBudget(session, deleteTarget.id);
      setDeleteTarget(null);
      await refreshBudgets();
    }, "No se pudo eliminar el presupuesto.");
  }

  if (mode === "categories") {
    return <section>
      <div className="section-heading">
        <div><p className="eyebrow">ORGANIZACIÓN</p><h1>Categorías</h1><p className="section-copy">Combina el catálogo inicial con categorías propias y subcategorías.</p></div>
        <button className="primary-button" onClick={() => { setEditingCategory(null); setDialog("category"); }}><Plus size={18} /> Nueva categoría</button>
      </div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="category-list">
        {roots.map((root) => {
          const children = categories.filter((category) => category.parent_id === root.id);
          return <article className={`category-list-item ${root.is_active ? "" : "is-archived"}`} key={root.id}>
            <div className="category-list-main"><span className="category-swatch" style={{ background: root.color }} /><div><h2>{root.name}</h2><small>{typeLabels[root.type]} · {root.is_default ? "Catálogo" : "Personal"}</small></div></div>
            {children.length > 0 && <details className="category-children"><summary>{children.length} subcategorías</summary><ul>{children.map((child) => <li key={child.id}><span className="category-child-name"><i style={{ background: root.color }} />{child.name}</span>{!child.is_default && <div><button aria-label={`Editar ${child.name}`} onClick={() => { setEditingCategory(child); setDialog("category"); }}><Pencil size={14} /></button><button aria-label={`Borrar ${child.name}`} onClick={() => void run(async () => { await deleteCategory(session, child.id); await onCategoriesChanged(); }, "No se puede borrar una categoría que ya tiene movimientos. Puedes desactivarla.")}><Trash2 size={14} /></button></div>}</li>)}</ul></details>}
            {!root.is_default && <div className="card-actions"><button className="text-button" onClick={() => { setEditingCategory(root); setDialog("category"); }}><Pencil size={14} /> Editar</button><button className="text-button" disabled={busy} onClick={() => void run(async () => { await setCategoryActive(root.id, !root.is_active); await onCategoriesChanged(); }, "No se pudo cambiar el estado.")}>{root.is_active ? <><Archive size={14} /> Desactivar</> : <><RotateCcw size={14} /> Restaurar</>}</button><button className="text-button account-delete" disabled={busy} onClick={() => void run(async () => { await deleteCategory(session, root.id); await onCategoriesChanged(); }, "No se puede borrar una categoría que ya tiene movimientos o subcategorías. Puedes desactivarla.")}><Trash2 size={14} /> Borrar</button></div>}
          </article>;
        })}
      </div>
      {dialog === "category" && <Dialog title={editingCategory ? "Editar categoría" : "Nueva categoría"} onClose={() => setDialog(null)}><CategoryForm categories={categories} category={editingCategory} busy={busy} onSubmit={submitCategory} onCancel={() => setDialog(null)} /></Dialog>}
    </section>;
  }

  const comparison = (overview?.budgeted_spent ?? 0) - (previous?.budgeted_spent ?? 0);
  return <section>
    <div className="section-heading">
      <div><p className="eyebrow">PLAN MENSUAL</p><h1>Presupuestos</h1><p className="section-copy">Controla límites por categoría sin mezclar monedas.</p></div>
      <button className="primary-button" disabled={!availableBudgetCategories.length} onClick={() => { setEditingBudget(null); setDialog("budget"); }}><Plus size={18} /> Nuevo presupuesto</button>
    </div>
    <div className="month-controls month-controls--single" aria-label="Periodo del presupuesto"><button aria-label="Mes anterior" onClick={() => setPeriod(shiftMonth(period, -1))}><ChevronLeft /></button><label className="month-picker-label"><span>{monthLabel(period)}</span><input aria-label="Mes y año" type="month" value={period.slice(0, 7)} onChange={(event) => setPeriod(`${event.target.value}-01`)} /></label><button aria-label="Mes siguiente" onClick={() => setPeriod(shiftMonth(period, 1))}><ChevronRight /></button></div>
    {error && <p className="inline-error" role="alert">{error}</p>}
    {loading ? <div className="skeleton-grid"><i /><i /><i /></div> : <>
      <div className="metrics-grid budget-metrics"><article className="metric-card"><p>Presupuestado</p><strong>{money(overview?.total_budget ?? 0, currency)}</strong><span className="metric-detail">{overview?.items.length ?? 0} categorías</span></article><article className="metric-card"><p>Gastado con presupuesto</p><strong>{money(overview?.budgeted_spent ?? 0, currency)}</strong><span className={comparison <= 0 ? "metric-detail metric-detail--positive" : "metric-detail"}>{comparison === 0 ? "Sin cambio mensual" : `${comparison > 0 ? "+" : ""}${money(comparison, currency)} frente al mes anterior`}</span></article><article className="metric-card"><p>Fuera de presupuesto</p><strong>{money(overview?.outside_budget_spent ?? 0, currency)}</strong><span className="metric-detail">Sin categoría o sin límite asignado</span></article></div>
      {overview?.items.length ? <div className="budget-list">{overview.items.map((item) => <article className={`budget-card budget-card--${item.status}`} key={item.id}><div className="budget-card__top"><span className="category-swatch" style={{ background: item.color }} /><div><h2>{item.category_name}</h2><small>{money(item.spent, currency)} de {money(item.amount, currency)}</small></div>{item.status !== "ok" && <AlertTriangle aria-label={item.status === "exceeded" ? "Presupuesto superado" : "Umbral alcanzado"} />}</div><div className="budget-progress" aria-label={`${Math.round(item.usage_pct)} por ciento utilizado`}><span style={{ width: `${Math.min(Math.max(item.usage_pct, 0), 100)}%` }} /></div><div className="budget-card__footer"><span>{item.remaining >= 0 ? `${money(item.remaining, currency)} disponibles` : `${money(Math.abs(item.remaining), currency)} excedidos`}</span><div><button aria-label={`Editar presupuesto de ${item.category_name}`} onClick={() => { setEditingBudget(item); setDialog("budget"); }}><Pencil size={15} /></button><button aria-label={`Eliminar presupuesto de ${item.category_name}`} onClick={() => setDeleteTarget(item)}><Trash2 size={15} /></button></div></div></article>)}</div> : <div className="empty-state"><CircleDollarSign size={30} /><h2>Aún no hay presupuestos en {monthLabel(period)}</h2><p>Los movimientos seguirán visibles como gasto fuera de presupuesto.</p>{availableBudgetCategories.length > 0 ? <button className="secondary-button" onClick={() => setDialog("budget")}>Crear el primero</button> : <p>Crea o activa una categoría de gasto para poder asignarle un límite.</p>}</div>}
    </>}
    {dialog === "budget" && <Dialog title={editingBudget ? "Editar presupuesto" : "Nuevo presupuesto"} onClose={() => setDialog(null)}><BudgetForm categories={availableBudgetCategories} budget={editingBudget} currency={currency} busy={busy} onSubmit={submitBudget} onCancel={() => setDialog(null)} /></Dialog>}
    {deleteTarget && <ModalFrame title="Eliminar presupuesto" onClose={() => setDeleteTarget(null)} labelledBy="delete-budget-dialog-title"><div className="confirm-copy"><p>Vas a eliminar el presupuesto de <strong>{deleteTarget.category_name}</strong>.</p><p>Los movimientos no se borrarán; solo dejarán de contar contra este límite mensual.</p></div><div className="dialog-actions"><button type="button" className="text-button" onClick={() => setDeleteTarget(null)}>Cancelar</button><button type="button" className="primary-button danger-button" disabled={busy} onClick={() => void confirmDeleteBudget()}>{busy ? "Eliminando…" : "Eliminar"}</button></div></ModalFrame>}
  </section>;
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <ModalFrame title={title} onClose={onClose} labelledBy="budget-dialog-title">{children}</ModalFrame>;
}

function CategoryForm({ categories, category, busy, onSubmit, onCancel }: { categories: Category[]; category: Category | null; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const [type, setType] = useState<CategoryType>(category?.type ?? "expense");
  const parents = categories.filter((item) => !item.parent_id && item.is_active && (item.type === type || item.type === "both") && item.id !== category?.id);
  return <form className="finance-form" onSubmit={onSubmit}><label>Nombre<input name="name" defaultValue={category?.name} maxLength={80} required autoFocus placeholder="Ej. Mascotas" /></label><label>Tipo<select name="type" value={type} disabled={Boolean(category)} onChange={(event) => setType(event.target.value as CategoryType)}><option value="expense">Gasto</option><option value="income">Ingreso</option><option value="both">Ingreso y gasto</option></select></label><label>Subcategoría de<select name="parent" defaultValue={category?.parent_id ?? ""}><option value="">Ninguna · categoría principal</option>{parents.map((parent) => <option value={parent.id} key={parent.id}>{parent.name}</option>)}</select></label><label>Color<input name="color" type="color" defaultValue={category?.color ?? "#6B7280"} required /></label><label>Icono<IconSelector value={category?.icon ?? "tag"} /></label><div className="dialog-actions"><button type="button" className="text-button" onClick={onCancel}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</button></div></form>;
}

function BudgetForm({ categories, budget, currency, busy, onSubmit, onCancel }: { categories: Category[]; budget: BudgetProgress | null; currency: string; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  return <form className="finance-form" onSubmit={onSubmit}>{budget ? <p className="form-context"><span className="category-swatch" style={{ background: budget.color }} />{budget.category_name}</p> : <label>Categoría<select name="category" required>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>}<label>Límite · {currency}<input name="amount" type="number" min="0.0001" step="0.0001" defaultValue={budget?.amount} required autoFocus /></label><label>Alertar al %<input name="threshold" type="number" min="1" max="100" defaultValue={budget?.alert_threshold_pct ?? 80} required /></label><div className="dialog-actions"><button type="button" className="text-button" onClick={onCancel}>Cancelar</button><button className="primary-button" disabled={busy || (!budget && !categories.length)}>{busy ? "Guardando…" : "Guardar presupuesto"}</button></div></form>;
}
