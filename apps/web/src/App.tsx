import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  Target,
  WalletCards,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { label: "Resumen", icon: LayoutDashboard, active: true },
  { label: "Cuentas", icon: WalletCards },
  { label: "Movimientos", icon: ArrowDownLeft },
  { label: "Presupuestos", icon: Target },
];

const metrics = [
  { label: "Disponible", value: "—", detail: "Conecta tus cuentas para empezar", tone: "neutral" },
  { label: "Ingresos", value: "—", detail: "Este mes", tone: "positive" },
  { label: "Gastos", value: "—", detail: "Este mes", tone: "neutral" },
];

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Ir al contenido principal
      </a>

      <aside className={menuOpen ? "sidebar sidebar--open" : "sidebar"} aria-label="Navegación principal">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span>Financiera</span>
        </div>
        <nav>
          {navigation.map(({ label, icon: Icon, active }) => (
            <button className={active ? "nav-link nav-link--active" : "nav-link"} key={label} type="button">
              <Icon aria-hidden="true" size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-link" type="button">
            <Settings aria-hidden="true" size={19} />
            <span>Configuración</span>
          </button>
          <button className="profile" type="button">
            <span className="profile-avatar">T</span>
            <span className="profile-copy"><strong>Tu espacio</strong><small>Sin sesión</small></span>
            <ChevronDown aria-hidden="true" size={16} />
          </button>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <button className="icon-button mobile-menu" type="button" aria-label="Abrir menú" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu aria-hidden="true" size={20} />
          </button>
          <div className="period-picker">
            <span className="eyebrow">PERIODO ACTUAL</span>
            <button type="button">Agosto 2026 <ChevronDown aria-hidden="true" size={16} /></button>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="Ayuda"><CircleHelp aria-hidden="true" size={20} /></button>
            <button className="icon-button notification" type="button" aria-label="Notificaciones"><Bell aria-hidden="true" size={20} /><span /></button>
            <button className="primary-button" type="button"><Plus aria-hidden="true" size={18} /> Añadir movimiento</button>
          </div>
        </header>

        <main id="main-content" className="main-content">
          <motion.section
            className="welcome"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div>
              <p className="eyebrow">VISTA GENERAL</p>
              <h1>Empieza con una visión clara.</h1>
              <p className="intro">Configura una cuenta y registra tu primer movimiento. El resumen se irá construyendo contigo.</p>
            </div>
            <button className="secondary-button" type="button"><CreditCard aria-hidden="true" size={18} /> Crear cuenta</button>
          </motion.section>

          <section className="metrics-grid" aria-label="Resumen financiero">
            {metrics.map((metric, index) => (
              <motion.article
                className="metric-card"
                key={metric.label}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
              >
                <p>{metric.label}</p>
                <strong>{metric.value}</strong>
                <span className={metric.tone === "positive" ? "metric-detail metric-detail--positive" : "metric-detail"}>{metric.detail}</span>
              </motion.article>
            ))}
          </section>

          <section className="dashboard-grid">
            <article className="surface surface--large">
              <div className="surface-heading">
                <div><p className="eyebrow">EVOLUCIÓN</p><h2>Flujo mensual</h2></div>
                <span className="surface-badge">Próximamente</span>
              </div>
              <div className="chart-placeholder" aria-label="Gráfico disponible al registrar movimientos">
                <div className="chart-line chart-line--one" />
                <div className="chart-line chart-line--two" />
                <div className="chart-line chart-line--three" />
                <p>Tu evolución aparecerá aquí.</p>
              </div>
            </article>
            <article className="surface">
              <div className="surface-heading">
                <div><p className="eyebrow">SIGUIENTE PASO</p><h2>Tu primera cuenta</h2></div>
                <ArrowUpRight aria-hidden="true" size={20} />
              </div>
              <p className="body-copy">Una cuenta representa dónde está tu dinero: banco, efectivo, tarjeta o ahorro.</p>
              <button className="text-button" type="button">Añadir una cuenta <ArrowUpRight aria-hidden="true" size={16} /></button>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}

