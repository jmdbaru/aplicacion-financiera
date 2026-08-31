import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type InstrumentType = "stock"|"fund"|"etf"|"bond"|"crypto"|"other";
export type OperationType = "buy"|"sell"|"dividend"|"fee";
export type Portfolio = { id:string; name:string; currency_code:string; cash_account_id:string|null; is_active:boolean };
export type Instrument = { id:string; symbol:string; name:string; instrument_type:InstrumentType; currency_code:string };
export type InvestmentPosition = { portfolio_id:string; portfolio_name:string; currency_code:string; instrument_id:string; symbol:string; instrument_name:string; quantity:number; cost_basis:number; dividends:number; latest_price:number; valuation_date:string|null; market_value:number; unrealized_result:number };
export type InvestmentsOverview = { total_market_value:number; total_cost_basis:number; total_result:number; positions:InvestmentPosition[] };

function client(){if(!supabase)throw new Error("Supabase no está configurado.");return supabase;}
const n=(value:unknown)=>Number(value??0);
export function parseInvestments(value:unknown):InvestmentsOverview{const payload=value as InvestmentsOverview;return{total_market_value:n(payload.total_market_value),total_cost_basis:n(payload.total_cost_basis),total_result:n(payload.total_result),positions:(payload.positions??[]).map((p)=>({...p,quantity:n(p.quantity),cost_basis:n(p.cost_basis),dividends:n(p.dividends),latest_price:n(p.latest_price),market_value:n(p.market_value),unrealized_result:n(p.unrealized_result)}))};}
export function returnPct(position:InvestmentPosition){return position.cost_basis===0?0:position.unrealized_result/Math.abs(position.cost_basis)*100;}
export async function loadInvestmentsOverview(){const {data,error}=await client().rpc("get_investments_overview");if(error)throw error;return parseInvestments(data);}
export async function loadPortfolios(session:Session){const {data,error}=await client().from("investment_portfolios").select("id,name,currency_code,cash_account_id,is_active").eq("user_id",session.user.id).order("created_at",{ascending:false});if(error)throw error;return (data??[]) as Portfolio[];}
export async function loadInstruments(session:Session){const {data,error}=await client().from("investment_instruments").select("id,symbol,name,instrument_type,currency_code").eq("user_id",session.user.id).order("symbol");if(error)throw error;return (data??[]) as Instrument[];}
export async function createPortfolio(session:Session,input:{name:string;currency_code:string;cash_account_id:string}){const {error}=await client().from("investment_portfolios").insert({user_id:session.user.id,name:input.name.trim(),currency_code:input.currency_code,cash_account_id:input.cash_account_id||null});if(error)throw error;}
export async function createInstrument(session:Session,input:{symbol:string;name:string;instrument_type:InstrumentType;currency_code:string}){const {error}=await client().from("investment_instruments").insert({user_id:session.user.id,symbol:input.symbol.trim().toUpperCase(),name:input.name.trim(),instrument_type:input.instrument_type,currency_code:input.currency_code});if(error)throw error;}
export async function createOperation(session:Session,input:{portfolio_id:string;instrument_id:string;operation_date:string;operation_type:OperationType;quantity:number;price:number;fees:number;notes:string}){const {error}=await client().from("investment_operations").insert({user_id:session.user.id,...input,notes:input.notes.trim()||null});if(error)throw error;}
export async function upsertValuation(session:Session,input:{instrument_id:string;valuation_date:string;price:number}){const {error}=await client().from("investment_valuations").upsert({user_id:session.user.id,instrument_id:input.instrument_id,valuation_date:input.valuation_date,price:input.price,source:"manual"},{onConflict:"user_id,instrument_id,valuation_date"});if(error)throw error;}
