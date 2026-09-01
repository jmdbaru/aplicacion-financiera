import { Archive, CheckCircle2, History, Plus, Target } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ModalFrame } from "./ModalFrame";
import { contribute, createGoal, loadContributions, loadGoals, updateGoalStatus, type Goal, type GoalContribution } from "./goals";

const money = (value: number, currency: string) => new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value);

export function GoalsWorkspace({ session, currency }: { session: Session; currency: string }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [history, setHistory] = useState<GoalContribution[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    try {
      const next = await loadGoals();
      setGoals(next);
      setHistory(await loadContributions(next.map((goal) => goal.id)));
    } catch {
      setError("No se pudieron cargar los objetivos.");
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  async function goal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await createGoal(session, String(form.get("name")), Number(form.get("amount")), currency, String(form.get("date")));
      setOpen(false);
      await refresh();
    } catch {
      setError("No se pudo crear el objetivo.");
    }
  }

  async function add(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await contribute(session, id, Number(form.get("amount")), String(form.get("note")));
      event.currentTarget.reset();
      await refresh();
    } catch {
      setError("No se pudo registrar la aportación.");
    }
  }

  async function status(id: string, next: "completed" | "archived") {
    try {
      await updateGoalStatus(session, id, next);
      await refresh();
    } catch {
      setError("No se pudo actualizar el estado.");
    }
  }

  return <section>
    <div className="section-heading"><div><p className="eyebrow">AHORRO</p><h1>Objetivos</h1></div><button className="primary-button" onClick={() => setOpen(true)}><Plus size={18} />Nuevo objetivo</button></div>
    {error && <p className="inline-error">{error}</p>}
    {goals.length ? <div className="goal-grid">{goals.map((goalItem) => <article className="surface" key={goalItem.id}><p className="eyebrow">{goalItem.status}</p><h2>{goalItem.name}</h2><strong>{money(goalItem.contributed, goalItem.currency_code)}</strong><p className="budget-copy">de {money(goalItem.target_amount, goalItem.currency_code)} · faltan {money(goalItem.remaining, goalItem.currency_code)}</p><div className="budget-track"><i style={{ width: `${goalItem.progress_pct}%` }} /></div>{goalItem.status === "active" && <form className="goal-add" onSubmit={(event) => void add(event, goalItem.id)}><input name="amount" type="number" min="0.01" step="0.01" placeholder="Aportación" required /><input name="note" maxLength={240} placeholder="Nota opcional" /><button className="secondary-button">Añadir</button></form>}<div className="goal-history"><History size={15} />{history.filter((item) => item.goal_id === goalItem.id).slice(0, 3).map((item) => <span key={item.id}>{new Date(item.contributed_on).toLocaleDateString("es-ES")} · {money(item.amount, goalItem.currency_code)}{item.note ? ` · ${item.note}` : ""}</span>)}</div>{goalItem.status === "active" && <button className="text-button" onClick={() => void status(goalItem.id, "completed")}><CheckCircle2 size={15} />Cerrar objetivo</button>}{goalItem.status !== "archived" && <button className="text-button" onClick={() => void status(goalItem.id, "archived")}><Archive size={15} />Archivar</button>}</article>)}</div> : <div className="empty-state"><Target size={28} /><h2>Aún no hay objetivos</h2><p>Empieza por una meta concreta: fondo de emergencia, viaje, entrada de vivienda o cualquier ahorro separado.</p><button className="secondary-button" onClick={() => setOpen(true)}>Crear el primero</button></div>}
    {open && <ModalFrame title="Nuevo objetivo" onClose={() => setOpen(false)} labelledBy="goal-dialog-title"><form className="finance-form" onSubmit={goal}><label>Nombre<input name="name" required maxLength={120} autoFocus placeholder="Ej. Fondo de emergencia" /></label><label>Meta<input name="amount" type="number" min="0.01" step="0.01" required /></label><label>Fecha objetivo<input name="date" type="date" /></label><div className="dialog-actions"><button type="button" className="text-button" onClick={() => setOpen(false)}>Cancelar</button><button className="primary-button">Guardar</button></div></form></ModalFrame>}
  </section>;
}
