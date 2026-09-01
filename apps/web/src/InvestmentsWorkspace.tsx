import { BarChart3, Landmark, Plus, RefreshCw } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { FinancialAccount } from "./finance";
import { ModalFrame } from "./ModalFrame";
import { createInstrument, createOperation, createPortfolio, loadInstruments, loadInvestmentsOverview, loadPortfolios, returnPct, upsertValuation, type Instrument, type InstrumentType, type InvestmentsOverview, type OperationType, type Portfolio } from "./investments";

const money = (value: number, currency: string) => new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
type InvestmentDialog = "portfolio" | "instrument" | "operation" | "valuation";

export function InvestmentsWorkspace({ session, accounts, currency }: { session: Session; accounts: FinancialAccount[]; currency: string }) {
  const [overview, setOverview] = useState<InvestmentsOverview | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [dialog, setDialog] = useState<InvestmentDialog | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setError("");
      const [nextOverview, nextPortfolios, nextInstruments] = await Promise.all([loadInvestmentsOverview(), loadPortfolios(session), loadInstruments(session)]);
      setOverview(nextOverview);
      setPortfolios(nextPortfolios);
      setInstruments(nextInstruments);
    } catch {
      setError("No se pudieron cargar las inversiones.");
    }
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function portfolio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await createPortfolio(session, { name: String(form.get("name")), currency_code: currency, cash_account_id: String(form.get("account") || "") });
      setDialog(null);
      await refresh();
    } catch {
      setError("No se pudo crear la cartera.");
    }
  }

  async function instrument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await createInstrument(session, { symbol: String(form.get("symbol")), name: String(form.get("name")), instrument_type: String(form.get("type")) as InstrumentType, currency_code: currency });
      setDialog(null);
      await refresh();
    } catch {
      setError("No se pudo crear el instrumento.");
    }
  }

  async function operation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await createOperation(session, { portfolio_id: String(form.get("portfolio")), instrument_id: String(form.get("instrument")), operation_date: String(form.get("date")), operation_type: String(form.get("type")) as OperationType, quantity: Number(form.get("quantity")), price: Number(form.get("price")), fees: Number(form.get("fees") || 0), notes: String(form.get("notes") || "") });
      setDialog(null);
      await refresh();
    } catch {
      setError("No se pudo registrar la operación.");
    }
  }

  async function valuation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await upsertValuation(session, { instrument_id: String(form.get("instrument")), valuation_date: String(form.get("date")), price: Number(form.get("price")) });
      setDialog(null);
      await refresh();
    } catch {
      setError("No se pudo guardar la valoración.");
    }
  }

  const total = overview ?? { total_market_value: 0, total_cost_basis: 0, total_result: 0, positions: [] };
  const canOperate = portfolios.length > 0 && instruments.length > 0;
  const nextStep = !portfolios.length ? "Crea una cartera para agrupar tus inversiones." : !instruments.length ? "Añade un instrumento antes de registrar operaciones." : "";

  return <section>
    <div className="section-heading"><div><p className="eyebrow">INVERSIONES</p><h1>Carteras</h1></div><div className="recurring-actions"><button className="secondary-button" onClick={() => setDialog("portfolio")}><Plus size={18} />Cartera</button><button className="secondary-button" onClick={() => setDialog("instrument")}><Plus size={18} />Instrumento</button><button className="primary-button" disabled={!canOperate} onClick={() => setDialog("operation")}><Plus size={18} />Operación</button></div></div>
    <p className="future-module-note">Módulo en evolución: próximamente tendrá cotizaciones automáticas, alertas y análisis de cartera.</p>
    {error && <p className="inline-error" role="alert">{error}</p>}
    {nextStep && <p className="ux-hint">{nextStep}</p>}
    <div className="metrics-grid dashboard-metrics"><Metric label="Valor mercado" value={money(total.total_market_value, currency)} detail={`${total.positions.length} posiciones`} /><Metric label="Coste neto" value={money(total.total_cost_basis, currency)} detail="Compras, ventas, comisiones y dividendos" /><Metric label="Resultado" value={money(total.total_result, currency)} detail="Rentabilidad simple documentada" positive={total.total_result >= 0} /></div>
    <div className="investment-actions"><button className="text-button" disabled={!instruments.length} onClick={() => setDialog("valuation")}><RefreshCw size={15} />Actualizar valoración</button></div>
    {total.positions.length ? <div className="transaction-list investment-list">{total.positions.map((position) => <article key={`${position.portfolio_id}-${position.instrument_id}`}><span className="movement-icon movement-icon--income"><BarChart3 /></span><div><strong>{position.symbol} · {position.instrument_name}</strong><small>{position.portfolio_name} · {position.quantity.toLocaleString("es-ES")} uds · precio {money(position.latest_price, position.currency_code)}</small></div><b className={position.unrealized_result >= 0 ? "positive" : "negative"}>{money(position.market_value, position.currency_code)} · {returnPct(position).toFixed(1)}%</b></article>)}</div> : <div className="empty-state"><Landmark size={28} /><h2>Aún no hay posiciones</h2><p>Empieza creando una cartera y después añade el instrumento que vas a comprar o valorar.</p><button className="secondary-button" onClick={() => setDialog(!portfolios.length ? "portfolio" : "instrument")}>{!portfolios.length ? "Crear cartera" : "Añadir instrumento"}</button></div>}
    {dialog && <ModalFrame title={title(dialog)} onClose={() => setDialog(null)} labelledBy="investment-dialog-title">{dialog === "portfolio" && <form className="finance-form" onSubmit={portfolio}><label>Nombre<input name="name" required maxLength={120} autoFocus placeholder="Ej. Cartera principal" /></label><label>Cuenta efectivo<select name="account" defaultValue=""><option value="">Sin vincular</option>{accounts.filter((account) => account.is_active && account.currency_code === currency).map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label><Actions onCancel={() => setDialog(null)} /></form>}{dialog === "instrument" && <form className="finance-form" onSubmit={instrument}><label>Símbolo<input name="symbol" required maxLength={24} autoFocus placeholder="Ej. VWCE" /></label><label>Nombre<input name="name" required maxLength={160} placeholder="Nombre del activo" /></label><label>Tipo<select name="type" defaultValue="etf"><option value="stock">Acción</option><option value="fund">Fondo</option><option value="etf">ETF</option><option value="bond">Bono</option><option value="crypto">Crypto</option><option value="other">Otro</option></select></label><Actions onCancel={() => setDialog(null)} /></form>}{dialog === "operation" && <form className="finance-form" onSubmit={operation}><label>Cartera<select name="portfolio" required>{portfolios.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Instrumento<select name="instrument" required>{instruments.map((item) => <option value={item.id} key={item.id}>{item.symbol}</option>)}</select></label><label>Tipo<select name="type" defaultValue="buy"><option value="buy">Compra</option><option value="sell">Venta</option><option value="dividend">Dividendo</option><option value="fee">Comisión</option></select></label><label>Fecha<input type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label>Cantidad<input name="quantity" type="number" min="0" step="0.000001" required /></label><label>Precio/importe<input name="price" type="number" min="0" step="0.000001" required /></label><label>Comisiones<input name="fees" type="number" min="0" step="0.01" defaultValue="0" /></label><label>Notas<input name="notes" maxLength={240} /></label><Actions onCancel={() => setDialog(null)} /></form>}{dialog === "valuation" && <form className="finance-form" onSubmit={valuation}><label>Instrumento<select name="instrument" required>{instruments.map((item) => <option value={item.id} key={item.id}>{item.symbol}</option>)}</select></label><label>Fecha<input type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label>Precio<input name="price" type="number" min="0" step="0.000001" required autoFocus /></label><Actions onCancel={() => setDialog(null)} /></form>}</ModalFrame>}
  </section>;
}

function title(dialog: InvestmentDialog) {
  return dialog === "portfolio" ? "Nueva cartera" : dialog === "instrument" ? "Nuevo instrumento" : dialog === "operation" ? "Nueva operación" : "Nueva valoración";
}

function Metric({ label, value, detail, positive = false }: { label: string; value: string; detail: string; positive?: boolean }) {
  return <article className="metric-card"><p>{label}</p><strong>{value}</strong><span className={positive ? "metric-detail metric-detail--positive" : "metric-detail"}>{detail}</span></article>;
}

function Actions({ onCancel }: { onCancel: () => void }) {
  return <div className="dialog-actions"><button type="button" className="text-button" onClick={onCancel}>Cancelar</button><button className="primary-button">Guardar</button></div>;
}
