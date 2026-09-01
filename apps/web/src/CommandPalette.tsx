import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";

export type CommandItem = {
  id: string;
  label: string;
  helper: string;
  group: string;
  onSelect: () => void;
};

export function CommandPalette({ items, onClose }: { items: CommandItem[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return items;
    return items.filter((item) => `${item.label} ${item.helper} ${item.group}`.toLocaleLowerCase().includes(normalized));
  }, [items, query]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setActiveIndex(0); }, [query]);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => filtered.length ? (index + 1) % filtered.length : 0); }
      if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => filtered.length ? (index - 1 + filtered.length) % filtered.length : 0); }
      if (event.key === "Enter" && filtered[activeIndex]) { event.preventDefault(); filtered[activeIndex].onSelect(); onClose(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, filtered, onClose]);

  return <div className="command-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="command-dialog" role="dialog" aria-modal="true" aria-labelledby="command-palette-title">
      <div className="command-heading"><div><p className="eyebrow">ACCESO RÁPIDO</p><h2 id="command-palette-title">¿Qué quieres hacer?</h2></div><button className="icon-action dialog-close" type="button" aria-label="Cerrar paleta" onClick={onClose}><X size={17} /></button></div>
      <label className="command-search"><Search size={17} aria-hidden="true" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar sección o acción…" aria-label="Buscar sección o acción" /></label>
      <div className="command-results" role="listbox" aria-label="Resultados">
        {filtered.length ? filtered.map((item, index) => <button key={item.id} className={`command-item ${index === activeIndex ? "is-active" : ""}`} type="button" role="option" aria-selected={index === activeIndex} onMouseEnter={() => setActiveIndex(index)} onClick={() => { item.onSelect(); onClose(); }}><span><strong>{item.label}</strong><small>{item.group} · {item.helper}</small></span><ArrowRight size={16} aria-hidden="true" /></button>) : <p className="command-empty">No hay resultados para “{query}”.</p>}
      </div>
      <footer className="command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Esc</kbd> cerrar</span></footer>
    </section>
  </div>;
}
