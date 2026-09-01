import { useMemo, useState, type FormEvent } from "react";
import { ArrowRightLeft, Plus, Trash2, Users } from "lucide-react";

type Expense = { id: number; payer: string; amount: number; participants: string[]; description: string };
type Settlement = { from: string; to: string; amount: number };

function settlements(people: string[], expenses: Expense[]): Settlement[] {
  const balances = new Map(people.map((person) => [person, 0]));
  expenses.forEach((expense) => {
    const share = expense.amount / expense.participants.length;
    balances.set(expense.payer, (balances.get(expense.payer) ?? 0) + expense.amount);
    expense.participants.forEach((person) => balances.set(person, (balances.get(person) ?? 0) - share));
  });
  const debtors = [...balances].filter(([, value]) => value < -0.005).map(([name, value]) => ({ name, value: -value }));
  const creditors = [...balances].filter(([, value]) => value > 0.005).map(([name, value]) => ({ name, value }));
  const result: Settlement[] = [];
  let debtor = 0; let creditor = 0;
  while (debtors[debtor] && creditors[creditor]) {
    const amount = Math.min(debtors[debtor].value, creditors[creditor].value);
    result.push({ from: debtors[debtor].name, to: creditors[creditor].name, amount });
    debtors[debtor].value -= amount; creditors[creditor].value -= amount;
    if (debtors[debtor].value < 0.005) debtor += 1;
    if (creditors[creditor].value < 0.005) creditor += 1;
  }
  return result;
}

export function SplitWorkspace({ currency }: { currency: string }) {
  const [people, setPeople] = useState<string[]>(["Tú", "Persona 2"]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [person, setPerson] = useState("");
  const [error, setError] = useState("");
  const money = (value: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value);
  const result = useMemo(() => settlements(people, expenses), [people, expenses]);
  const addPerson = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const name = person.trim(); if (!name || people.includes(name)) return; setPeople((items) => [...items, name]); setPerson(""); };
  const addExpense = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const amount = Number(form.get("amount")); const participants = form.getAll("participant").map(String); if (!amount || !participants.length) { setError("Indica un importe y al menos una persona."); return; } setExpenses((items) => [...items, { id: Date.now(), description: String(form.get("description")), payer: String(form.get("payer")), amount, participants }]); setError(""); event.currentTarget.reset(); };
  return <section><div className="section-heading"><div><p className="eyebrow">REPARTOS</p><h1>Gastos compartidos</h1><p className="section-copy">Calcula quién debe pagar a quién en un viaje, cena o evento.</p></div></div><div className="split-layout"><article className="surface split-panel"><div className="surface-heading"><div><p className="eyebrow">PERSONAS</p><h2>Participantes</h2></div><Users size={20} /></div><div className="split-people">{people.map((item) => <span key={item}>{item}</span>)}</div><form className="split-person-form" onSubmit={addPerson}><input value={person} onChange={(event) => setPerson(event.target.value)} placeholder="Añadir persona" maxLength={60} /><button className="secondary-button" type="submit"><Plus size={16} /> Añadir</button></form></article><article className="surface split-panel"><div className="surface-heading"><div><p className="eyebrow">NUEVO GASTO</p><h2>Quién ha pagado</h2></div><ArrowRightLeft size={20} /></div><form className="split-expense-form" onSubmit={addExpense}><input name="description" required maxLength={120} placeholder="Ej. Hotel, cena, gasolina" /><input name="amount" required type="number" min="0.01" step="0.01" placeholder="Importe" /><select name="payer">{people.map((item) => <option key={item}>{item}</option>)}</select><fieldset><legend>Se divide entre</legend>{people.map((item) => <label key={item}><input name="participant" type="checkbox" value={item} defaultChecked />{item}</label>)}</fieldset>{error && <p className="inline-error">{error}</p>}<button className="primary-button" type="submit"><Plus size={17} /> Añadir gasto</button></form></article></div><div className="split-layout"><article className="surface split-panel"><div className="surface-heading"><div><p className="eyebrow">REGISTRO</p><h2>Operaciones</h2></div></div>{expenses.length ? <div className="split-list">{expenses.map((item) => <div key={item.id}><span><strong>{item.description}</strong><small>{item.payer} pagó · {item.participants.join(", ")}</small></span><b>{money(item.amount)}</b><button className="icon-action" aria-label={`Eliminar ${item.description}`} onClick={() => setExpenses((items) => items.filter((expense) => expense.id !== item.id))}><Trash2 size={15} /></button></div>)}</div> : <p className="budget-copy">Añade el primer gasto para calcular los saldos.</p>}</article><article className="surface split-panel"><div className="surface-heading"><div><p className="eyebrow">LIQUIDACIÓN</p><h2>Pagos sugeridos</h2></div></div>{result.length ? <div className="split-list">{result.map((item, index) => <div key={`${item.from}-${item.to}-${index}`}><span><strong>{item.from} paga a {item.to}</strong><small>Pago mínimo sugerido</small></span><b className="positive">{money(item.amount)}</b></div>)}</div> : <p className="budget-copy">Cuando haya gastos desiguales, aquí verás el mínimo de pagos para equilibrarlos.</p>}</article></div></section>;
}
