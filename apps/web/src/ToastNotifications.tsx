import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { ToastContext, type ToastContextValue, type ToastTone } from "./toast";

type Toast = { id: number; message: string; tone: ToastTone };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const notify = useCallback((message: string, tone: ToastTone = "error") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, message, tone }].slice(-3));
    window.setTimeout(() => dismiss(id), 2800);
  }, [dismiss]);
  const value = useMemo(() => ({ notify }), [notify]);

  return <ToastContext.Provider value={value}>{children}<ToastBridge notify={notify} /><aside className="toast-stack" aria-live="polite" aria-label="Avisos">{toasts.map((toast) => <div className={`toast toast--${toast.tone}`} role="status" key={toast.id}>{toast.tone === "success" ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}<span>{toast.message}</span><button type="button" aria-label="Cerrar aviso" onClick={() => dismiss(toast.id)}><X size={15} /></button></div>)}</aside></ToastContext.Provider>;
}

function ToastBridge({ notify }: ToastContextValue) {
  useEffect(() => {
    const announce = () => document.querySelectorAll<HTMLElement>(".inline-error, .account-toast, .inline-success").forEach((element) => {
      if (element.dataset.toastAnnounced || !element.textContent?.trim()) return;
      element.dataset.toastAnnounced = "true";
      notify(element.textContent.trim(), element.classList.contains("inline-success") ? "success" : "error");
    });
    announce();
    const observer = new MutationObserver(announce);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [notify]);
  return null;
}
