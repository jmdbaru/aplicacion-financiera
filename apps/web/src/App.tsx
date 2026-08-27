import { LogOut, Plus, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthPanel } from "./AuthPanel";
import { getInitials, type Profile, supabase } from "./supabase";

async function loadProfile(session: Session): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("display_name, currency_code, locale, time_zone").eq("user_id", session.user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export function App() {
  const [session, setSession] = useState<Session | null>(null); const [profile, setProfile] = useState<Profile | null>(null); const [loading, setLoading] = useState(Boolean(supabase)); const [recoveryActive, setRecoveryActive] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => { if (alive) setSession(data.session); }).finally(() => { if (alive) setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => { setSession(nextSession); if (event === "PASSWORD_RECOVERY") setRecoveryActive(true); });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => { if (!session) { setProfile(null); return; } void loadProfile(session).then(setProfile).catch(() => setProfile(null)); }, [session]);
  if (!supabase) return <AuthPanel recoveryActive={false} />;
  if (loading) return <main className="loading-screen"><span className="brand-mark">F</span><p>Preparando tu espacio…</p></main>;
  if (!session) return <AuthPanel recoveryActive={recoveryActive} />;
  const name = profile?.display_name || session.user.email?.split("@")[0] || "Tu espacio";
  return <div className="app-shell"><a className="skip-link" href="#main-content">Ir al contenido principal</a><aside className="sidebar" aria-label="Navegación principal"><div className="brand"><span className="brand-mark">F</span><span>Financiera</span></div><nav><button className="nav-link nav-link--active" type="button">Resumen</button><button className="nav-link" type="button">Cuentas</button><button className="nav-link" type="button">Movimientos</button><button className="nav-link" type="button">Presupuestos</button></nav><div className="sidebar-footer"><div className="profile"><span className="profile-avatar">{getInitials(session, profile)}</span><span className="profile-copy"><strong>{name}</strong><small>{profile?.currency_code || "EUR"} · sesión activa</small></span></div><button className="nav-link sign-out" type="button" onClick={() => { if (supabase) void supabase.auth.signOut(); }}><LogOut aria-hidden="true" size={19} /><span>Cerrar sesión</span></button></div></aside><div className="content-shell"><header className="topbar"><div className="period-picker"><span className="eyebrow">PERIODO ACTUAL</span><button type="button">Agosto 2026</button></div><button className="primary-button" type="button"><Plus aria-hidden="true" size={18} /> Añadir movimiento</button></header><main id="main-content" className="main-content"><section className="welcome"><div><p className="eyebrow">VISTA GENERAL</p><h1>Hola, {name}.</h1><p className="intro">Configura una cuenta y registra tu primer movimiento. El resumen se irá construyendo contigo.</p></div><button className="secondary-button" type="button"><WalletCards aria-hidden="true" size={18} /> Crear cuenta</button></section><section className="metrics-grid" aria-label="Resumen financiero"><article className="metric-card"><p>Disponible</p><strong>—</strong><span className="metric-detail">Conecta tus cuentas para empezar</span></article><article className="metric-card"><p>Ingresos</p><strong>—</strong><span className="metric-detail metric-detail--positive">Este mes</span></article><article className="metric-card"><p>Gastos</p><strong>—</strong><span className="metric-detail">Este mes</span></article></section></main></div></div>;
}
