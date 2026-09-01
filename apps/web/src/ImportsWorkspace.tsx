import { Archive, FileSpreadsheet, Play, Plus, Wand2 } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Category } from "./budgets";
import type { FinancialAccount } from "./finance";
import { confirmImportBatch, createCategorizationRule, createImportBatch, loadCategorizationRules, normalizeImportRows, parseCsv, setCategorizationRuleActive, type CategorizationRule, type ImportPreviewRow } from "./imports";

const money = (value: number, currency: string) => new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(value);

export function ImportsWorkspace({ session, accounts, categories, currency, onImported }: { session: Session; accounts: FinancialAccount[]; categories: Category[]; currency: string; onImported: () => void }) {
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [rows, setRows] = useState<ImportPreviewRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [accountId, setAccountId] = useState(accounts.find((account) => account.is_active)?.id ?? "");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const activeAccounts = accounts.filter((account) => account.is_active);
  const activeCategories = categories.filter((category) => category.is_active && (category.type === "expense" || category.type === "income" || category.type === "both"));

  useEffect(() => {
    loadCategorizationRules(session).then(setRules).catch(() => setError("No se pudieron cargar las reglas."));
  }, [session]);

  useEffect(() => {
    if (!accountId && activeAccounts[0]) setAccountId(activeAccounts[0].id);
  }, [activeAccounts, accountId]);

  const stats = useMemo(() => rows.reduce((acc, row) => ({ ...acc, [row.status]: acc[row.status] + 1 }), { ready: 0, invalid: 0, duplicate: 0 }), [rows]);

  async function file(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setError("");
    setMessage("");
    setBatchId(null);
    setFileName(selected.name);
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setError("Soporte inicial: sube CSV o un Excel guardado como CSV.");
      return;
    }
    const text = await selected.text();
    setRows(normalizeImportRows(parseCsv(text), rules));
  }

  async function stage() {
    try {
      if (!accountId) throw new Error("Crea o selecciona una cuenta antes de guardar la preview.");
      const id = await createImportBatch(session, accountId, fileName || "import.csv", rows);
      setBatchId(id);
      setMessage("Preview guardada. Puedes confirmar la importación.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la preview.");
    }
  }

  async function confirm() {
    if (!batchId) return;
    try {
      const result = await confirmImportBatch(batchId);
      setMessage(`${result.imported} movimientos importados, ${result.duplicates} duplicados, ${result.invalid} inválidos.`);
      await onImported();
    } catch {
      setError("No se pudo confirmar la importación.");
    }
  }

  async function rule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await createCategorizationRule(session, { name: String(form.get("name")), match_text: String(form.get("match")), transaction_type: String(form.get("type")) as "income" | "expense" | "", category_id: String(form.get("category")), priority: Number(form.get("priority") || 100) });
      event.currentTarget.reset();
      setRules(await loadCategorizationRules(session));
    } catch {
      setError("No se pudo crear la regla.");
    }
  }

  async function toggleRule(item: CategorizationRule) {
    try {
      await setCategorizationRuleActive(session, item.id, !item.is_active);
      setRules(await loadCategorizationRules(session));
    } catch {
      setError("No se pudo actualizar la regla.");
    }
  }

  return <section>
    <div className="section-heading"><div><p className="eyebrow">IMPORTACIÓN</p><h1>Importar movimientos</h1></div>{batchId ? <button className="primary-button" onClick={() => void confirm()}><Play size={18} />Confirmar</button> : <button className="primary-button" disabled={!activeAccounts.length || !rows.some((row) => row.status === "ready")} onClick={() => void stage()}><FileSpreadsheet size={18} />Guardar preview</button>}</div>
    {!activeAccounts.length && <p className="ux-hint">Antes de importar necesitas una cuenta destino activa. Crea una cuenta y vuelve aquí para subir el CSV.</p>}
    {!activeCategories.length && <p className="ux-hint">Puedes importar sin reglas, pero para crear automatizaciones necesitas al menos una categoría activa.</p>}
    {error && <p className="inline-error" role="alert">{error}</p>}
    {message && <p className="auth-message" role="status">{message}</p>}
    <div className="import-layout"><article className="surface import-panel"><div className="surface-heading"><div><p className="eyebrow">STAGING</p><h2>Archivo y mapeo automático</h2></div><FileSpreadsheet size={20} /></div><label className="file-drop"><input type="file" accept=".csv,text/csv" disabled={!activeAccounts.length} onChange={(event) => void file(event)} /><span>CSV con columnas fecha/date, concepto/description e importe/amount</span></label><label>Cuenta destino<select value={accountId} disabled={!activeAccounts.length} onChange={(event) => setAccountId(event.target.value)}>{activeAccounts.map((account) => <option value={account.id} key={account.id}>{account.name} · {account.currency_code}</option>)}</select></label><div className="import-stats"><span>{stats.ready} listas</span><span>{stats.invalid} inválidas</span><span>{stats.duplicate} duplicadas</span></div></article><article className="surface import-panel"><div className="surface-heading"><div><p className="eyebrow">REGLAS</p><h2>Categorización automática</h2></div><Wand2 size={20} /></div><form className="rule-form" onSubmit={rule}><input name="name" placeholder="Nombre" required maxLength={120} disabled={!activeCategories.length} /><input name="match" placeholder="Texto a buscar" required maxLength={120} disabled={!activeCategories.length} /><select name="type" defaultValue="" disabled={!activeCategories.length}><option value="">Ambos</option><option value="expense">Gasto</option><option value="income">Ingreso</option></select><select name="category" required disabled={!activeCategories.length}>{activeCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select><input name="priority" type="number" min="1" max="9999" defaultValue="100" disabled={!activeCategories.length} /><button className="secondary-button" disabled={!activeCategories.length}><Plus size={16} />Regla</button></form><div className="rule-list">{rules.map((ruleItem) => <div key={ruleItem.id}><p><strong>{ruleItem.name}</strong><small>{ruleItem.match_text} · prioridad {ruleItem.priority}</small></p><button className="text-button" onClick={() => void toggleRule(ruleItem)}><Archive size={15} />{ruleItem.is_active ? "Pausar" : "Activar"}</button></div>)}</div></article></div>
    {rows.length ? <div className="transaction-list import-preview">{rows.slice(0, 30).map((row) => <article key={row.row_number}><span className={`status-dot status-dot--${row.status}`} /><div><strong>{row.description || "Sin concepto"}</strong><small>Fila {row.row_number} · {row.effective_date || "sin fecha"} · {row.error_message || row.status}</small></div><b className={row.transaction_type === "income" ? "positive" : "negative"}>{row.amount !== null ? money(row.amount, currency) : "Sin importe"}</b></article>)}</div> : <div className="empty-state import-empty"><FileSpreadsheet size={28} /><h2>Sube un CSV para previsualizar</h2><p>Primero se genera una preview; solo se crean movimientos cuando confirmas explícitamente.</p></div>}
  </section>;
}
