import { type FormEvent, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Profile } from "./supabase";
import { supabase } from "./supabase";
import { ModalFrame } from "./ModalFrame";

export function PreferencesForm({ profile, session, onSaved, onClose }: { profile: Profile | null; session: Session; onSaved: (profile: Profile) => void; onClose: () => void }) {
  const [saving, setSaving] = useState(false); const [message, setMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState(() => window.localStorage.getItem("financiera.theme") || "green");
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!supabase) return;
    const form = new FormData(event.currentTarget); setSaving(true); setMessage(null);
    const update = { display_name: String(form.get("displayName") || "").trim() || null, currency_code: String(form.get("currency") || "EUR"), locale: String(form.get("locale") || "es-ES"), time_zone: String(form.get("timeZone") || "Europe/Madrid") };
    const { data, error } = await supabase.from("profiles").update(update).eq("user_id", session.user.id).select("display_name, currency_code, locale, time_zone").single();
    setSaving(false); if (error) { setMessage("No se pudieron guardar las preferencias."); return; } onSaved(data); window.localStorage.setItem("financiera.theme", theme); document.documentElement.dataset.theme = theme; setMessage("Preferencias guardadas.");
  };
  return <form className="preferences-panel" onSubmit={save}><p className="eyebrow">PREFERENCIAS</p><label>Moneda principal<select name="currency" defaultValue={profile?.currency_code || "EUR"}><option value="EUR">Euro (EUR)</option><option value="USD">Dólar estadounidense (USD)</option><option value="GBP">Libra esterlina (GBP)</option></select></label><label>Idioma<select name="locale" defaultValue={profile?.locale || "es-ES"}><option value="es-ES">Español</option><option value="en">English</option></select></label><label>Zona horaria<select name="timeZone" defaultValue={profile?.time_zone || "Europe/Madrid"}><option>Europe/Madrid</option><option>Europe/London</option><option>America/New_York</option><option>America/Mexico_City</option><option>UTC</option></select></label><label>Estilo de color<select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="green">Verde financiero</option><option value="purple">Morado nocturno</option><option value="blue">Azul profesional</option><option value="pink">Rosa editorial</option></select></label>{message && <p className="auth-message">{message}</p>}<div className="preferences-actions"><button className="secondary-button" type="button" onClick={onClose}>Cerrar</button><button className="primary-button" disabled={saving} type="submit">{saving ? "Guardando…" : "Guardar cambios"}</button></div></form>;
}

export function PreferencesPanel({ profile, session, onSaved }: { profile: Profile | null; session: Session; onSaved: (profile: Profile) => void }) {
  const [open, setOpen] = useState(false);
  return <>{<button className="nav-link" type="button" onClick={() => setOpen(true)}><span>Configuración</span></button>}{open && <ModalFrame title="Tu espacio, a tu manera." onClose={() => setOpen(false)} labelledBy="preferences-dialog-title"><PreferencesForm profile={profile} session={session} onSaved={onSaved} onClose={() => setOpen(false)} /></ModalFrame>}</>;
}
