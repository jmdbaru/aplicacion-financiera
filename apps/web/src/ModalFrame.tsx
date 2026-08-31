import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function ModalFrame({ title, children, onClose, labelledBy = "modal-title" }: { title: string; children: ReactNode; onClose: () => void; labelledBy?: string }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="finance-dialog" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <button className="icon-action dialog-close" type="button" aria-label="Cerrar modal" onClick={onClose}><X size={16} /></button>
      <h2 id={labelledBy}>{title}</h2>
      {children}
    </section>
  </div>;
}
