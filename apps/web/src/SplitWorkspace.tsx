import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRightLeft, CheckCircle2, History, Plus, Users } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { CurrencySelector } from "./CatalogSelectors";
import { ModalFrame } from "./ModalFrame";
import { useToast } from "./toast";
import {
  addSplitExpense, addSplitParticipant, addSplitSettlement, calculateSettlementSuggestions,
  createSplitEvent, loadSplitDetail, loadSplitEvents, type SettlementSuggestion,
  type SplitEvent, type SplitExpense, type SplitParticipant, type SplitSettlement,
} from "./splits";

const money = (value: number, currency: string) => new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value);

export function SplitWorkspace({ session, currency }: { session: Session; currency: string }) {
  const { notify } = useToast();
  const [events, setEvents] = useState<SplitEvent[]>([]);
  const [event, setEvent] = useState<SplitEvent | null>(null);
  const [people, setPeople] = useState<SplitParticipant[]>([]);
  const [expenses, setExpenses] = useState<SplitExpense[]>([]);
  const [settlements, setSettlements] = useState<SplitSettlement[]>([]);
  const [section, setSection] = useState<"expenses" | "settlements">("expenses");
  const [newEvent, setNewEvent] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (target = event) => {
    setEvents(await loadSplitEvents(session));
    if (target) {
      const detail = await loadSplitDetail(session, target.id);
      setPeople(detail.participants); setExpenses(detail.expenses); setSettlements(detail.settlements);
    }
  }, [session, event]);

  useEffect(() => { void load().catch(() => setError("No se pudieron cargar los repartos.")); }, [load]);
  const suggestions = useMemo(() => calculateSettlementSuggestions(people, expenses, settlements), [people, expenses, settlements]);

  async function openEvent(item: SplitEvent) {
    setEvent(item); setSection("expenses"); setHistoryOpen(false); setError(""); await load(item);
  }
  async function create(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault(); const form = new FormData(eventForm.currentTarget);
    try {
      const item = await createSplitEvent(session, { name: String(form.get("name")), event_type: String(form.get("type")) as SplitEvent["event_type"], currency_code: String(form.get("currency")), notes: null });
      await openEvent(item); setNewEvent(false); notify("Evento creado.", "success");
    } catch { setError("No se pudo crear el evento."); }
  }
  async function addPerson(personForm: FormEvent<HTMLFormElement>) {
    personForm.preventDefault(); if (!event) return; const form = personForm.currentTarget;
    try { await addSplitParticipant(session, event.id, String(new FormData(form).get("name"))); form.reset(); await load(); }
    catch { setError("No se pudo añadir el participante."); }
  }
  async function addExpense(expenseForm: FormEvent<HTMLFormElement>) {
    expenseForm.preventDefault(); if (!event) return;
    const form = expenseForm.currentTarget, data = new FormData(form), participantIds = data.getAll("participant").map(String), payerId = String(data.get("payer") ?? ""), amount = Number(data.get("amount"));
    if (!payerId || !people.some((person) => person.id === payerId)) return setError("Elige quién ha pagado este gasto.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Indica un importe mayor que cero.");
    if (!participantIds.length) return setError("Selecciona al menos un participante.");
    setSaving(true);
    try {
      await addSplitExpense(session, { event_id: event.id, payer_id: payerId, description: String(data.get("description")).trim(), amount, expense_date: String(data.get("date")), participant_ids: participantIds });
      setError(""); form.reset(); await load(); notify("Gasto añadido al reparto.", "success");
    } catch { setError("No se pudo guardar el gasto. Revisa el importe y los participantes."); }
    finally { setSaving(false); }
  }
  async function settle(item: SettlementSuggestion) {
    if (!event) return; setSaving(true);
    try {
      await addSplitSettlement(session, { event_id: event.id, payer_id: item.payer.id, recipient_id: item.recipient.id, amount: item.amount, settled_on: new Date().toISOString().slice(0, 10) });
      await load(); notify(`${item.payer.name} ha marcado su pago.`, "success");
    } catch { setError("No se pudo registrar el pago."); }
    finally { setSaving(false); }
  }

  if (historyOpen) return <section className="split-history-workspace"><div className="section-heading"><div><p className="eyebrow">REPARTOS</p><h1>Historial de eventos</h1><p className="section-copy">Consulta un evento anterior o vuelve al reparto actual.</p></div><button className="text-button" type="button" onClick={() => setHistoryOpen(false)}>Volver a repartos</button></div><div className="split-history-list split-history-list--page">{events.length ? events.map((item) => <button type="button" key={item.id} onClick={() => void openEvent(item)}><span><strong>{item.name}</strong><small>{item.event_type === "trip" ? "Viaje" : item.event_type === "home" ? "Casa" : "Evento"} · {item.currency_code}</small></span><span>{new Date(item.created_at).toLocaleDateString("es-ES")}</span></button>) : <div className="empty-state"><History size={28} /><h2>Todavía no hay eventos creados</h2></div>}</div></section>;

  return <section>
    <div className="section-heading"><div><p className="eyebrow">REPARTOS</p><h1>{event?.name ?? "Gastos compartidos"}</h1><p className="section-copy">{event ? "Añade gastos y revisa las liquidaciones cuando lo necesites." : "Crea un evento y conserva su historial de gastos compartidos."}</p></div><div className="section-actions">{event && <button className="text-button" type="button" onClick={() => setEvent(null)}>Volver</button>}<button className="secondary-button" type="button" onClick={() => setHistoryOpen(true)}><History size={16} /> Historial</button>{!event && <button className="primary-button" onClick={() => setNewEvent(true)}><Plus size={18} /> Nuevo evento</button>}</div></div>
    {error && <p className="inline-error">{error}</p>}
    {event ? <>
      <div className="workspace-toggle workspace-toggle--inner" role="tablist" aria-label="Contenido del reparto"><button type="button" role="tab" aria-selected={section === "expenses"} className={section === "expenses" ? "is-active" : ""} onClick={() => setSection("expenses")}>Gastos</button><button type="button" role="tab" aria-selected={section === "settlements"} className={section === "settlements" ? "is-active" : ""} onClick={() => setSection("settlements")}>Pagos pendientes {suggestions.length ? `(${suggestions.length})` : ""}</button></div>
      {section === "expenses" ? <>
        <div className="split-layout"><article className="surface split-panel"><div className="surface-heading"><h2>Participantes</h2><Users size={20} /></div><div className="split-people">{people.map((item) => <span key={item.id}>{item.name}</span>)}</div><form className="split-person-form" onSubmit={addPerson}><input name="name" required placeholder="Añadir persona" /><button className="secondary-button"><Plus size={16} /> Añadir</button></form></article>
        <article className="surface split-panel"><div className="surface-heading"><h2>Nuevo gasto</h2><ArrowRightLeft size={20} /></div><form className="split-expense-form" onSubmit={addExpense}><input name="description" required placeholder="Hotel, cena, gasolina" /><input name="amount" type="number" min=".01" step=".01" required placeholder="Importe" /><select name="payer" defaultValue="" required><option value="" disabled>Quién ha pagado</option>{people.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /><fieldset className="split-participant-picker"><legend>Personas incluidas</legend>{people.map((item) => <label key={item.id}><input type="checkbox" name="participant" value={item.id} defaultChecked />{item.name}</label>)}</fieldset><button className="primary-button" disabled={!people.length || saving}>{saving ? "Guardando…" : "Añadir gasto"}</button></form></article></div>
        <article className="surface split-panel split-panel--wide"><h2>Operaciones</h2><div className="split-list">{expenses.length ? expenses.map((item) => <div key={item.id}><span><strong>{item.description}</strong><small>{people.find((person) => person.id === item.payer_id)?.name} pagó · {item.participant_ids.length} participantes</small></span><b>{money(item.amount, event.currency_code)}</b></div>) : <p className="ux-hint">Aún no hay gastos en este evento.</p>}</div></article>
      </> : <article className="surface split-panel split-panel--wide"><div className="surface-heading"><h2>Liquidación del evento</h2><CheckCircle2 size={20} /></div><p className="section-copy">Marca cada pago cuando se haya realizado. El saldo pendiente se recalcula automáticamente.</p><div className="split-list">{suggestions.length ? suggestions.map((item, index) => <div key={`${item.payer.id}-${item.recipient.id}-${index}`}><span><strong>{item.payer.name} → {item.recipient.name}</strong><small>Liquidación sugerida</small></span><b className="negative">{money(item.amount, event.currency_code)}</b><button className="text-button" type="button" disabled={saving} onClick={() => void settle(item)}><CheckCircle2 size={15} /> Marcar pagado</button></div>) : <p className="ux-hint">No quedan pagos pendientes.</p>}</div>{settlements.length > 0 && <div className="split-settled-history">{settlements.map((item) => <small key={item.id}>{people.find((person) => person.id === item.payer_id)?.name} pagó a {people.find((person) => person.id === item.recipient_id)?.name} · {money(item.amount, event.currency_code)}</small>)}</div>}</article>}
    </> : <div className="empty-state"><Users size={28} /><h2>Selecciona o crea un evento</h2><button className="secondary-button" onClick={() => setNewEvent(true)}>Crear evento</button></div>}
    {newEvent && <ModalFrame title="Nuevo evento" onClose={() => setNewEvent(false)} labelledBy="split-event-title"><form className="finance-form" onSubmit={create}><label>Nombre<input name="name" required autoFocus placeholder="Viaje a Lisboa" /></label><label>Tipo<select name="type"><option value="trip">Viaje</option><option value="event">Evento</option><option value="home">Casa</option></select></label><label>Moneda<CurrencySelector value={currency} /></label><div className="dialog-actions"><button className="primary-button">Crear y continuar</button></div></form></ModalFrame>}
  </section>;
}
