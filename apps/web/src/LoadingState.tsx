import { motion, useReducedMotion } from "motion/react";
import { Brand } from "./Brand";

export function LoadingState({ label = "Actualizando tus datos…", fullScreen = false }: { label?: string; fullScreen?: boolean }) {
  const reduced = useReducedMotion();
  return <section className={`finance-loading ${fullScreen ? "finance-loading--full" : ""}`} aria-label={label} aria-live="polite"><motion.div className="finance-loading-mark" animate={reduced ? undefined : { rotate: 360 }} transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}><Brand compact label="NUMA" /></motion.div><div><strong>{label}</strong><span>Calculando tu resumen financiero</span></div></section>;
}
