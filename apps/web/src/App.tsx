import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthPanel } from "./AuthPanel";
import { FinanceWorkspace } from "./FinanceWorkspace";
import { type Profile, supabase } from "./supabase";

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
  return <FinanceWorkspace session={session} defaultCurrency={profile?.currency_code || "EUR"} profile={profile} onProfileSaved={setProfile} onSignOut={() => { if (supabase) void supabase.auth.signOut(); }} />;
}
