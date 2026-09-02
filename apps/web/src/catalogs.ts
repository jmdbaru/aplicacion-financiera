import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

export type AppCurrency = { code: string; name: string; symbol: string; locale: string; sort_order: number };
export type AppIcon = { slug: string; label: string; icon_group: string; sort_order: number };

const fallbackCurrencies: AppCurrency[] = [
  { code: "EUR", name: "Euro", symbol: "€", locale: "es-ES", sort_order: 10 },
  { code: "CZK", name: "Corona checa", symbol: "Kč", locale: "cs-CZ", sort_order: 20 },
  { code: "USD", name: "Dólar estadounidense", symbol: "$", locale: "en-US", sort_order: 30 },
  { code: "GBP", name: "Libra esterlina", symbol: "£", locale: "en-GB", sort_order: 40 },
];
const fallbackIcons: AppIcon[] = [
  { slug: "tag", label: "Etiqueta", icon_group: "general", sort_order: 10 },
  { slug: "home", label: "Hogar", icon_group: "hogar", sort_order: 20 },
  { slug: "shopping-bag", label: "Compras", icon_group: "gasto", sort_order: 30 },
  { slug: "utensils", label: "Restaurantes", icon_group: "gasto", sort_order: 40 },
  { slug: "car", label: "Transporte", icon_group: "gasto", sort_order: 50 },
  { slug: "zap", label: "Suministros", icon_group: "hogar", sort_order: 60 },
];

async function loadCurrencies() {
  if (!supabase) return fallbackCurrencies;
  const { data, error } = await supabase.from("app_currencies").select("code,name,symbol,locale,sort_order").order("sort_order");
  if (error) throw error;
  return (data ?? []) as AppCurrency[];
}
async function loadIcons() {
  if (!supabase) return fallbackIcons;
  const { data, error } = await supabase.from("app_icons").select("slug,label,icon_group,sort_order").order("sort_order");
  if (error) throw error;
  return (data ?? []) as AppIcon[];
}

export function useCurrencyCatalog() { return useQuery({ queryKey: ["app-currencies"], queryFn: loadCurrencies, placeholderData: fallbackCurrencies }); }
export function useIconCatalog() { return useQuery({ queryKey: ["app-icons"], queryFn: loadIcons, placeholderData: fallbackIcons }); }
