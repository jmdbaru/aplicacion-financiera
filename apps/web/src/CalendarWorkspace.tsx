import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { loadCalendarTransactions, type LedgerTransaction } from "./finance";

const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const money = (value: number, currency: string) => new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value);

export function CalendarWorkspace({ session, currency }: { session: Session; currency: string }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(dateKey(new Date()));
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  useEffect(() => { const from = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().slice(0, 10); const to = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().slice(0, 10); void loadCalendarTransactions(session, from, to).then(setTransactions).catch(() => setTransactions([])); }, [month, session]);
  const days = useMemo(() => { const start = new Date(month); start.setDate(1 - ((start.getDay() + 6) % 7)); return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)); }, [month]);
  const selectedItems = transactions.filter((item) => item.effective_date === selected);
  const title = month.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  return <section><div className="section-heading"><div><p className="eyebrow">CALENDARIO</p><h1>Operaciones diarias</h1><p className="section-copy">Consulta qué movimientos se registraron cada día.</p></div><CalendarDays size={24} /></div><div className="calendar-layout"><article className="surface"><div className="month-controls"><button aria-label="Mes anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button><strong>{title}</strong><button aria-label="Mes siguiente" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button></div><div className="calendar-weekdays">{["L", "M", "X", "J", "V", "S", "D"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{days.map((day) => { const key = dateKey(day); const items = transactions.filter((item) => item.effective_date === key); return <button key={key} className={`calendar-day ${day.getMonth() === month.getMonth() ? "" : "is-outside"} ${key === selected ? "is-selected" : ""}`} onClick={() => setSelected(key)}><span>{day.getDate()}</span>{items.length > 0 && <i>{items.length}</i>}</button>; })}</div></article><article className="surface calendar-detail"><p className="eyebrow">{new Date(`${selected}T00:00:00`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p><h2>Operaciones del día</h2>{selectedItems.length ? <div className="split-list">{selectedItems.map((item) => <div key={item.id}><span><strong>{item.description}</strong><small>{item.transaction_type}</small></span><b>{money(Number(item.ledger_entries.find((entry) => entry.entry_kind === "account")?.amount ?? 0), currency)}</b></div>)}</div> : <p className="budget-copy">No hay operaciones registradas en este día.</p>}</article></div></section>;
}
