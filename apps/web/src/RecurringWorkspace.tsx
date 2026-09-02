import { Archive, CalendarDays, Plus, RotateCcw, Trash2 } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { FinancialAccount } from "./finance";
import type { Category } from "./budgets";
import { ModalFrame } from "./ModalFrame";
import { createRecurringRule, deleteRecurringRule, generateRecurring, loadRecurringRules, setRecurringActive, type RecurringRule } from "./recurring";

const money = (value: number, currency: string) => new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value);

export function RecurringWorkspace({ session, accounts, categories, currency }: { session: Session; accounts: FinancialAccount[]; categories: Category[]; currency: string }) {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const activeAccounts = useMemo(() => accounts.filter((account) => account.is_active && account.currency_code === currency), [accounts, currency]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRules(await loadRecurringRules(session));
    } catch {
      setError("No se pudieron cargar las recurrencias.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    let active = true;
    void generateRecurring(new Date().toISOString().slice(0, 10))
      .catch(() => { if (active) setError("Hay una operación recurrente pendiente que necesita revisar su cuenta."); })
      .finally(() => { if (active) void refresh(); });
    return () => { active = false; };
  }, [refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const frequency = String(form.get("frequency")) as RecurringRule["frequency"];
      const next = String(form.get("next_run_on"));
      await createRecurringRule(session, {
        name: String(form.get("name")),
        transaction_type: String(form.get("type")) as RecurringRule["transaction_type"],
        account_id: String(form.get("account_id")),
        destination_account_id: null,
        category_id: String(form.get("category_id") || "") || null,
        currency_code: currency,
        amount: Number(form.get("amount")),
        frequency,
        interval_count: 1,
        weekday: frequency === "weekly" ? new Date(`${next}T00:00:00`).getDay() : null,
        monthly_day: frequency === "monthly" ? Number(next.slice(8, 10)) : null,
        next_run_on: next,
        end_on: null,
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Madrid",
      });
      setOpen(false);
      await refresh();
    } catch {
      setError("No se pudo guardar la regla. Revisa los campos.");
    } finally {
      setBusy(false);
    }
  }

  return <section>
    <div className="section-heading"><div><p className="eyebrow">AUTOMATIZACIÓN</p><h1>Movimientos recurrentes</h1><p className="section-copy">Los vencimientos se registran automáticamente en la cuenta y fecha indicadas al abrir la aplicación.</p></div><button className="primary-button" disabled={!activeAccounts.length} onClick={() => setOpen(true)}><Plus size={18} /> Nueva regla</button></div>
    {error && <p className="inline-error">{error}</p>}
    {!activeAccounts.length && <p className="ux-hint">Crea primero una cuenta activa en {currency}. Las reglas recurrentes necesitan saber dónde registrar cada movimiento.</p>}
    {loading ? <section className="skeleton-grid"><i /><i /><i /></section> : rules.length ? <div className="recurring-list">{rules.map((rule) => <article className={!rule.is_active ? "is-archived" : ""} key={rule.id}><span>{rule.frequency === "monthly" ? "MENSUAL" : rule.frequency === "weekly" ? "SEMANAL" : "DIARIA"}</span><div><strong>{rule.name}</strong><small>{rule.transaction_type === "income" ? "Ingreso" : "Gasto"} · {accounts.find((account) => account.id === rule.account_id)?.name ?? "Cuenta archivada"} · {categories.find((category) => category.id === rule.category_id)?.name ?? "Sin categoría"} · Próxima: {new Date(`${rule.next_run_on}T00:00:00`).toLocaleDateString("es-ES")}</small></div><b className={rule.transaction_type === "income" ? "positive" : "negative"}>{money(rule.amount, rule.currency_code)}</b><div className="recurring-rule-actions"><button className="icon-action" title={rule.is_active ? "Desactivar" : "Activar"} onClick={() => void (async () => { setBusy(true); await setRecurringActive(session, rule.id, !rule.is_active); await refresh(); setBusy(false); })()}>{rule.is_active ? <Archive size={15} /> : <RotateCcw size={15} />}</button><button className="icon-action account-delete" title="Borrar regla" onClick={() => void (async () => { setBusy(true); try { await deleteRecurringRule(session, rule.id); await refresh(); } catch { setError("No se puede borrar una regla que ya tiene operaciones generadas. Puedes desactivarla."); } finally { setBusy(false); } })()}><Trash2 size={15} /></button></div></article>)}</div> : <div className="empty-state"><CalendarDays size={28} /><h2>No hay reglas recurrentes</h2><p>Automatiza ingresos o gastos que se repiten cada mes, semana o día.</p>{activeAccounts.length > 0 && <button className="secondary-button" onClick={() => setOpen(true)}>Crear la primera</button>}</div>}
    {open && <ModalFrame title="Regla recurrente" onClose={() => setOpen(false)} labelledBy="recurring-dialog-title"><form className="finance-form" onSubmit={submit}><label>Concepto<input name="name" required maxLength={120} autoFocus placeholder="Ej. Alquiler, nómina..." /></label><label>Tipo<select name="type"><option value="expense">Gasto</option><option value="income">Ingreso</option></select></label><label>Cuenta<select name="account_id" required>{activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label>Categoría<select name="category_id"><option value="">Sin categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.parent_id ? "↳ " : ""}{category.name}</option>)}</select></label><label>Importe<input name="amount" type="number" min="0.0001" step="0.0001" required /></label><label>Frecuencia<select name="frequency"><option value="monthly">Mensual</option><option value="weekly">Semanal</option><option value="daily">Diaria</option></select></label><label>Primera fecha<input name="next_run_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><div className="dialog-actions"><button type="button" className="text-button" onClick={() => setOpen(false)}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</button></div></form></ModalFrame>}
  </section>;
}
