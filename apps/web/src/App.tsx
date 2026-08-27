import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthPanel } from "./AuthPanel";
import { FinanceWorkspace } from "./FinanceWorkspace";
import { PreferencesPanel } from "./PreferencesPanel";
import { getInitials, type Profile, supabase } from "./supabase";

async function loadProfile(session: Session): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("display_name, currency_code, locale, time_zone").eq("user_id", session.user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [recoveryActive, setRecoveryActive] = useState(false);
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
  return <div className="app-shell"><a className="skip-link" href="#main-content">Ir al contenido principal</a><aside className="sidebar" aria-label="Identidad y configuración"><div className="brand"><span className="brand-mark">F</span><span>Financiera</span></div><div className="sidebar-note"><span>Ledger protegido</span><p>Tus saldos se calculan desde movimientos trazables.</p></div><div className="sidebar-footer"><PreferencesPanel profile={profile} session={session} onSaved={setProfile} /><div className="profile"><span className="profile-avatar">{getInitials(session, profile)}</span><span className="profile-copy"><strong>{name}</strong><small>{profile?.currency_code || "EUR"} · sesión activa</small></span></div><button className="nav-link sign-out" type="button" onClick={() => { if (supabase) void supabase.auth.signOut(); }}><LogOut aria-hidden="true" size={19} /><span>Cerrar sesión</span></button></div></aside><div className="content-shell"><FinanceWorkspace session={session} defaultCurrency={profile?.currency_code || "EUR"} /></div></div>;
}
