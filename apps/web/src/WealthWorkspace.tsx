import { Archive, Landmark, LineChart, Plus, RefreshCw, TrendingUp } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ModalFrame } from "./ModalFrame";
import { addWealthValuation, calculateWealthTotals, createWealthItem, loadWealth, loadWealthValuations, setWealthItemActive, type WealthCategory, type WealthItem, type WealthType, type WealthValuation } from "./wealth";

const categoryLabels: Record<WealthCategory, string> = { property: "Inmueble", vehicle: "Vehículo", investment: "Inversión", cash_equivalent: "Liquidez", loan: "Préstamo", mortgage: "Hipoteca", credit: "Crédito", other: "Otro" };
const typeLabels: Record<WealthType, string> = { asset: "Activo", liability: "Pasivo" };
const money = (value: number, currency: string) => new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value);

export function WealthWorkspace({ session, currency }: { session: Session; currency: string }) {
  const [items, setItems] = useState<WealthItem[]>([]);
  const [valuations, setValuations] = useState<WealthValuation[]>([]);
  const [dialog, setDialog] = useState<"item" | null>(null);
  const [valuing, setValuing] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = async () => {
    try {
      setError("");
      const next = await loadWealth();
      setItems(next);
      setValuations(await loadWealthValuations(next.map((item) => item.id)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el patrimonio.");
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const totals = useMemo(() => calculateWealthTotals(items), [items]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await createWealthItem(session, {
        name: String(form.get("name")),
        item_type: String(form.get("type")) as WealthType,
        category: String(form.get("category")) as WealthCategory,
        currency_code: currency,
        notes: String(form.get("notes") || ""),
        initial_value: Number(form.get("amount")),
        valuation_date: String(form.get("date")),
      });
      setDialog(null);
      await refresh();
    } catch {
      setError("No se pudo crear la posición patrimonial.");
    }
  }

  async function value(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await addWealthValuation(session, id, Number(form.get("amount")), String(form.get("date")), String(form.get("note") || ""));
      setValuing(null);
      await refresh();
    } catch {
      setError("No se pudo guardar la valoración.");
    }
  }

  async function toggle(item: WealthItem) {
    try {
      await setWealthItemActive(session, item.id, !item.is_active);
      await refresh();
    } catch {
      setError("No se pudo cambiar el estado.");
    }
  }

  return <section>
    <div className="section-heading"><div><p className="eyebrow">PATRIMONIO</p><h1>Activos y pasivos</h1></div><button className="primary-button" onClick={() => setDialog("item")}><Plus size={18} />Nueva posición</button></div>
    <p className="future-module-note">Módulo en evolución: próximamente incluirá proyecciones, documentos y alertas de valoración.</p>
    {error && <p className="inline-error">{error}</p>}
    <div className="wealth-summary"><article><span>Patrimonio neto</span><strong>{money(totals.net, currency)}</strong><small className={totals.change >= 0 ? "positive" : "negative"}>{totals.change >= 0 ? "+" : ""}{money(totals.change, currency)} vs valoración previa</small></article><article><span>Activos</span><strong>{money(totals.assets, currency)}</strong></article><article><span>Pasivos</span><strong>{money(totals.liabilities, currency)}</strong></article></div>
    {items.length ? <div className="wealth-grid">{items.map((item) => {
      const history = valuations.filter((valuation) => valuation.item_id === item.id).slice(0, 4);
      return <article className={`surface wealth-card ${item.is_active ? "" : "is-archived"}`} key={item.id}><div className="wealth-card-head"><span className={`movement-icon movement-icon--${item.item_type === "asset" ? "income" : "expense"}`}>{item.item_type === "asset" ? <TrendingUp /> : <Landmark />}</span><div><p className="eyebrow">{typeLabels[item.item_type]} · {categoryLabels[item.category]}</p><h2>{item.name}</h2></div></div><strong>{money(item.latest_amount, item.currency_code)}</strong><p className="budget-copy">{item.latest_date ? `Valorado el ${new Date(`${item.latest_date}T00:00:00`).toLocaleDateString("es-ES")}` : "Sin valoración"} · flujo separado del ledger</p><div className="goal-history"><LineChart size={15} />{history.map((valuation) => <span key={valuation.id}>{new Date(`${valuation.valuation_date}T00:00:00`).toLocaleDateString("es-ES")} · {money(valuation.amount, item.currency_code)}{valuation.note ? ` · ${valuation.note}` : ""}</span>)}</div>{valuing === item.id ? <form className="goal-add" onSubmit={(event) => void value(event, item.id)}><input name="amount" type="number" min="0" step="0.01" placeholder="Valor actual" required /><input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /><input name="note" maxLength={240} placeholder="Nota" /><button className="secondary-button">Guardar</button><button className="text-button" type="button" onClick={() => setValuing(null)}>Cancelar</button></form> : <button className="text-button" onClick={() => setValuing(item.id)}><RefreshCw size={15} />Actualizar valoración</button>}<button className="text-button" onClick={() => void toggle(item)}><Archive size={15} />{item.is_active ? "Archivar" : "Restaurar"}</button></article>;
    })}</div> : <div className="empty-state"><Landmark size={28} /><h2>Aún no hay patrimonio</h2><p>Registra activos y deudas importantes sin mezclarlo con los movimientos diarios.</p><button className="secondary-button" onClick={() => setDialog("item")}>Crear la primera posición</button></div>}
    {dialog && <ModalFrame title="Nueva posición patrimonial" onClose={() => setDialog(null)} labelledBy="wealth-dialog-title"><form className="finance-form" onSubmit={create}><label>Nombre<input name="name" required maxLength={120} autoFocus placeholder="Vivienda, coche, hipoteca..." /></label><label>Tipo<select name="type" defaultValue="asset"><option value="asset">Activo</option><option value="liability">Pasivo</option></select></label><label>Categoría<select name="category" defaultValue="property">{Object.entries(categoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Valor inicial<input name="amount" type="number" min="0" step="0.01" required /></label><label>Fecha de valoración<input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label>Notas<input name="notes" maxLength={240} /></label><div className="dialog-actions"><button type="button" className="text-button" onClick={() => setDialog(null)}>Cancelar</button><button className="primary-button">Guardar</button></div></form></ModalFrame>}
  </section>;
}
