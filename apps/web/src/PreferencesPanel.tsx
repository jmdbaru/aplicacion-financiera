import { type FormEvent, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Profile } from "./supabase";
import { supabase } from "./supabase";
import { ModalFrame } from "./ModalFrame";
import { CurrencySelector } from "./CatalogSelectors";

const accentOptions = [
  { id: "serena", label: "Serena", tone: "#2E7D6B" },
  { id: "ocean", label: "Ocean", tone: "#287BC1" },
  { id: "violet", label: "Violet", tone: "#7357C8" },
  { id: "coral", label: "Coral", tone: "#E87562" },
  { id: "graphite", label: "Graphite", tone: "#505755" },
];

function initialAccent() {
  const stored = window.localStorage.getItem("numa.accent");
  if (stored) return stored;
  const legacy = window.localStorage.getItem("financiera.theme");
  return ({ green: "serena", blue: "ocean", purple: "violet", pink: "coral" } as Record<string, string>)[legacy || ""] || "serena";
}

export function PreferencesForm({ profile, session, onSaved, onClose }: { profile: Profile | null; session: Session; onSaved: (profile: Profile) => void; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [accent, setAccent] = useState(initialAccent);
  const [colorMode, setColorMode] = useState(() => window.localStorage.getItem("numa.color-mode") || "dark");
  const preview = (nextAccent = accent, nextMode = colorMode) => {
    document.documentElement.dataset.theme = nextAccent;
    document.documentElement.dataset.colorMode = nextMode;
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setMessage(null);
    const update = { display_name: String(form.get("displayName") || "").trim() || null, currency_code: String(form.get("currency") || "EUR"), locale: String(form.get("locale") || "es-ES"), time_zone: String(form.get("timeZone") || "Europe/Madrid") };
    const { data, error } = await supabase.from("profiles").update(update).eq("user_id", session.user.id).select("display_name, currency_code, locale, time_zone").single();
    setSaving(false);
    if (error) { setMessage("No se pudieron guardar las preferencias."); return; }
    onSaved(data);
    window.localStorage.setItem("numa.accent", accent);
    window.localStorage.setItem("numa.color-mode", colorMode);
    window.localStorage.removeItem("financiera.interface-style");
    preview();
    setMessage("Preferencias guardadas.");
  };
  return <form className="preferences-panel" onSubmit={save}>
    <p className="eyebrow">PREFERENCIAS NUMA</p>
    <label>Moneda principal<CurrencySelector value={profile?.currency_code || "EUR"} /></label>
    <label>Idioma<select name="locale" defaultValue={profile?.locale || "es-ES"}><option value="es-ES">Español</option><option value="en">English</option></select></label>
    <label>Zona horaria<select name="timeZone" defaultValue={profile?.time_zone || "Europe/Madrid"}><option>Europe/Madrid</option><option>Europe/London</option><option>Europe/Prague</option><option>America/New_York</option><option>America/Mexico_City</option><option>UTC</option></select></label>
    <fieldset className="theme-picker"><legend>Acento de tu espacio</legend><div className="theme-options">{accentOptions.map((item) => <button key={item.id} className={`theme-option ${accent === item.id ? "is-selected" : ""}`} type="button" aria-pressed={accent === item.id} onClick={() => { setAccent(item.id); preview(item.id); }}><span className="theme-swatch" style={{ background: item.tone }} /><span>{item.label}</span></button>)}</div><small>La identidad NUMA se mantiene; este color personaliza controles y estados activos.</small></fieldset>
    <fieldset className="theme-picker"><legend>Apariencia</legend><div className="theme-options">{[{ id: "dark", label: "Oscuro" }, { id: "light", label: "Claro" }].map((item) => <button key={item.id} className={`theme-option ${colorMode === item.id ? "is-selected" : ""}`} type="button" aria-pressed={colorMode === item.id} onClick={() => { setColorMode(item.id); preview(accent, item.id); }}><span className={`interface-preview interface-preview--${item.id}`} /><span>{item.label}</span></button>)}</div></fieldset>
    {message && <p className="auth-message">{message}</p>}
    <div className="preferences-actions"><button className="secondary-button" type="button" onClick={onClose}>Cerrar</button><button className="primary-button" disabled={saving} type="submit">{saving ? "Guardando…" : "Guardar cambios"}</button></div>
  </form>;
}

export function PreferencesPanel({ profile, session, onSaved }: { profile: Profile | null; session: Session; onSaved: (profile: Profile) => void }) {
  const [open, setOpen] = useState(false);
  return <>{<button className="nav-link" type="button" onClick={() => setOpen(true)}><span>Configuración</span></button>}{open && <ModalFrame title="Tu espacio, a tu manera." onClose={() => setOpen(false)} labelledBy="preferences-dialog-title"><PreferencesForm profile={profile} session={session} onSaved={onSaved} onClose={() => setOpen(false)} /></ModalFrame>}</>;
}
