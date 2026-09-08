import { supabase } from "./supabase";

export type ReportMonth = { period_start:string; income:number; expenses:number; balance:number };
export type ReportCategory = { category_name:string; subcategory_name?:string|null; transaction_type:"income"|"expense"; amount:number; operations:number };
export type ReportsOverview = { date_from:string; date_to:string; currency_code:string; income:number; expenses:number; balance:number; previous_income:number; previous_expenses:number; previous_balance:number; monthly:ReportMonth[]; categories:ReportCategory[] };
export type ReportPeriod = "day" | "week" | "month" | "year";

function client(){if(!supabase)throw new Error("Supabase no está configurado.");return supabase;}
const numeric=(value:unknown)=>Number(value??0);

export function parseReports(value:unknown):ReportsOverview{const payload=value as ReportsOverview;return{...payload,income:numeric(payload.income),expenses:numeric(payload.expenses),balance:numeric(payload.balance),previous_income:numeric(payload.previous_income),previous_expenses:numeric(payload.previous_expenses),previous_balance:numeric(payload.previous_balance),monthly:(payload.monthly??[]).map((m)=>({...m,income:numeric(m.income),expenses:numeric(m.expenses),balance:numeric(m.balance)})),categories:(payload.categories??[]).map((c)=>({...c,amount:numeric(c.amount),operations:numeric(c.operations)}))};}
export function periodComparison(current:number,previous:number){if(previous===0)return current===0?0:100;return (current-previous)/Math.abs(previous)*100;}
export function reportRows(data:ReportsOverview){return [["Tipo","Concepto","Importe","Operaciones"],...data.categories.map((item)=>[item.transaction_type==="income"?"Ingreso":"Gasto",item.category_name,String(item.amount),String(item.operations)]),["Resumen","Ingresos",String(data.income),""],["Resumen","Gastos",String(data.expenses),""],["Resumen","Balance",String(data.balance),""]];}
export function toCsv(rows:string[][]){return rows.map((row)=>row.map((cell)=>`"${cell.replaceAll("\"","\"\"")}"`).join(",")).join("\n");}
export async function loadReports(dateFrom:string,dateTo:string,currencyCode:string){const {data,error}=await client().rpc("get_reports_overview",{p_date_from:dateFrom,p_date_to:dateTo,p_currency_code:currencyCode});if(error)throw error;return parseReports(data);}

const pad=(value:number)=>String(value).padStart(2,"0");
const isoDate=(value:Date)=>`${value.getFullYear()}-${pad(value.getMonth()+1)}-${pad(value.getDate())}`;
const dateAtNoon=(value:string)=>new Date(`${value}T12:00:00`);
const startOfWeek=(value:Date)=>{const result=new Date(value);result.setDate(result.getDate()-((result.getDay()+6)%7));return result;};
const endOfMonth=(value:Date)=>new Date(value.getFullYear(),value.getMonth()+1,0,12);

export function reportPeriodRange(period:ReportPeriod, reference=new Date()){const date=new Date(reference.getFullYear(),reference.getMonth(),reference.getDate(),12);if(period==="day")return{dateFrom:isoDate(date),dateTo:isoDate(date)};if(period==="week"){const start=startOfWeek(date);const end=new Date(start);end.setDate(end.getDate()+6);return{dateFrom:isoDate(start),dateTo:isoDate(end)};}if(period==="month")return{dateFrom:isoDate(new Date(date.getFullYear(),date.getMonth(),1,12)),dateTo:isoDate(endOfMonth(date))};return{dateFrom:isoDate(new Date(date.getFullYear(),0,1,12)),dateTo:isoDate(new Date(date.getFullYear(),11,31,12))};}
export function shiftReportPeriod(period:ReportPeriod, dateFrom:string, direction:-1|1){const date=dateAtNoon(dateFrom);if(period==="day")date.setDate(date.getDate()+direction);if(period==="week")date.setDate(date.getDate()+direction*7);if(period==="month")date.setMonth(date.getMonth()+direction);if(period==="year")date.setFullYear(date.getFullYear()+direction);return reportPeriodRange(period,date);}
export function reportPeriodLabel(period:ReportPeriod,dateFrom:string,dateTo:string){const from=dateAtNoon(dateFrom);const to=dateAtNoon(dateTo);if(period==="day")return from.toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"});if(period==="week")return `${from.toLocaleDateString("es-ES",{day:"numeric",month:"short"})} — ${to.toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"})}`;if(period==="month")return from.toLocaleDateString("es-ES",{month:"long",year:"numeric"});return String(from.getFullYear());}
