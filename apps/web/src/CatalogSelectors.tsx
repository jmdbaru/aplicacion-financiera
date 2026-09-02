import { BriefcaseBusiness, Car, ChartNoAxesCombined, CircleDollarSign, Gift, GraduationCap, HeartPulse, Home, Landmark, PiggyBank, Plane, ReceiptText, ShoppingBag, Tag, Utensils, Zap, type LucideIcon } from "lucide-react";
import { useCurrencyCatalog, useIconCatalog } from "./catalogs";

const icons: Record<string, LucideIcon> = { tag: Tag, home: Home, "shopping-bag": ShoppingBag, utensils: Utensils, car: Car, "heart-pulse": HeartPulse, "graduation-cap": GraduationCap, plane: Plane, gift: Gift, "receipt-text": ReceiptText, zap: Zap, landmark: Landmark, "briefcase-business": BriefcaseBusiness, "chart-no-axes-combined": ChartNoAxesCombined, "circle-dollar-sign": CircleDollarSign, "piggy-bank": PiggyBank };

export function CurrencySelector({ name = "currency", value }: { name?: string; value: string }) {
  const { data: currencies = [] } = useCurrencyCatalog();
  return <select name={name} defaultValue={value} required aria-label="Moneda">{currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.name} · {currency.symbol} ({currency.code})</option>)}</select>;
}

export function IconSelector({ value }: { value: string }) {
  const { data: catalog = [] } = useIconCatalog();
  const Icon = icons[value] ?? Tag;
  return <div className="catalog-icon-selector"><Icon size={18} aria-hidden="true" /><select name="icon" defaultValue={value} required aria-label="Icono de categoría">{catalog.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select></div>;
}
