import { CalendarDays, Plus, RefreshCw } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { FinancialAccount } from "./finance";
import { ModalFrame } from "./ModalFrame";
import { createRecurringRule, generateRecurring, loadRecurringRules, type RecurringRule } from "./recurring";

const money = (value: number, currency: string) => new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value);

export function RecurringWorkspace({ session, accounts, currency }: { session: Session; accounts: FinancialAccount[]; currency: string }) {
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
    void refresh();
  }, [refresh]);

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const created = await generateRecurring(new Date().toISOString().slice(0, 10));
      await refresh();
      if (!created) setError("No había ejecuciones pendientes para hoy.");
    } catch {
      setError("No se pudieron generar las operaciones pendientes.");
    } finally {
      setBusy(false);
    }
  }

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
    <div className="section-heading"><div><p className="eyebrow">CALENDARIO</p><h1>Movimientos recurrentes</h1></div><div className="recurring-actions"><button className="secondary-button" disabled={busy} onClick={() => void generate()}><RefreshCw size={17} /> Generar hoy</button><button className="primary-button" disabled={!activeAccounts.length} onClick={() => setOpen(true)}><Plus size={18} /> Nueva regla</button></div></div>
    {error && <p className="inline-error">{error}</p>}
    {!activeAccounts.length && <p className="ux-hint">Crea primero una cuenta activa en {currency}. Las reglas recurrentes necesitan saber dónde registrar cada movimiento.</p>}
    {loading ? <section className="skeleton-grid"><i /><i /><i /></section> : rules.length ? <div className="recurring-grid">{rules.map((rule) => <article className="account-card" key={rule.id}><span>{rule.frequency === "monthly" ? "MENSUAL" : rule.frequency === "weekly" ? "SEMANAL" : "DIARIA"}</span><h2>{rule.name}</h2><strong>{money(rule.amount, rule.currency_code)}</strong><small>Próxima: {new Date(`${rule.next_run_on}T00:00:00`).toLocaleDateString("es-ES")}</small></article>)}</div> : <div className="empty-state"><CalendarDays size={28} /><h2>No hay reglas recurrentes</h2><p>Automatiza ingresos o gastos que se repiten cada mes, semana o día.</p>{activeAccounts.length > 0 && <button className="secondary-button" onClick={() => setOpen(true)}>Crear la primera</button>}</div>}
    {open && <ModalFrame title="Regla recurrente" onClose={() => setOpen(false)} labelledBy="recurring-dialog-title"><form className="finance-form" onSubmit={submit}><label>Concepto<input name="name" required maxLength={120} autoFocus placeholder="Ej. Alquiler, nómina..." /></label><label>Tipo<select name="type"><option value="expense">Gasto</option><option value="income">Ingreso</option></select></label><label>Cuenta<select name="account_id" required>{activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label>Importe<input name="amount" type="number" min="0.0001" step="0.0001" required /></label><label>Frecuencia<select name="frequency"><option value="monthly">Mensual</option><option value="weekly">Semanal</option><option value="daily">Diaria</option></select></label><label>Primera fecha<input name="next_run_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><div className="dialog-actions"><button type="button" className="text-button" onClick={() => setOpen(false)}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</button></div></form></ModalFrame>}
  </section>;
}
