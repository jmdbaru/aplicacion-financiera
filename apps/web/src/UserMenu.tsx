import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, UserRound } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { ModalFrame } from "./ModalFrame";
import { PreferencesForm } from "./PreferencesPanel";
import type { Profile } from "./supabase";

export function UserMenu({ session, profile, onProfileSaved, onSignOut }: { session: Session; profile: Profile | null; onProfileSaved: (profile: Profile) => void; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<"preferences" | "personal" | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const name = profile?.display_name || session.user.email?.split("@")[0] || "Tu perfil";
  useEffect(() => { const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  return <div className="user-menu" ref={ref}><button className="user-menu-trigger" type="button" aria-label="Abrir menú de perfil" aria-expanded={open} onClick={() => setOpen((value) => !value)}><span className="profile-avatar">{name.slice(0, 1).toUpperCase()}</span></button>{open && <div className="user-menu-dropdown" role="menu"><div className="user-menu-card"><span className="profile-avatar">{name.slice(0, 1).toUpperCase()}</span><span><strong>{name}</strong><small>{session.user.email}</small></span></div><button type="button" role="menuitem" onClick={() => { setPanel("preferences"); setOpen(false); }}><Settings size={16} /> Configuración</button><button type="button" role="menuitem" onClick={() => { setPanel("personal"); setOpen(false); }}><UserRound size={16} /> Datos personales</button><button type="button" role="menuitem" className="user-menu-danger" onClick={onSignOut}><LogOut size={16} /> Cerrar sesión</button></div>}{panel === "preferences" && <ModalFrame title="Configuración" onClose={() => setPanel(null)} labelledBy="preferences-dialog-title"><PreferencesForm profile={profile} session={session} onSaved={onProfileSaved} onClose={() => setPanel(null)} /></ModalFrame>}{panel === "personal" && <ModalFrame title="Datos personales" onClose={() => setPanel(null)} labelledBy="personal-data-title"><div className="personal-data"><p className="eyebrow">CUENTA</p><dl><div><dt>Nombre visible</dt><dd>{profile?.display_name || "Sin definir"}</dd></div><div><dt>Username</dt><dd>{session.user.user_metadata?.username || name}</dd></div><div><dt>Correo electrónico</dt><dd>{session.user.email || "Sin correo"}</dd></div></dl><div className="dialog-actions"><button className="secondary-button" type="button" onClick={() => setPanel(null)}>Cerrar</button></div></div></ModalFrame>}</div>;
}
