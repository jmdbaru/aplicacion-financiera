import { supabase } from "./supabase";

export type ReportMonth = { period_start:string; income:number; expenses:number; balance:number };
export type ReportCategory = { category_name:string; transaction_type:"income"|"expense"; amount:number; operations:number };
export type ReportsOverview = { date_from:string; date_to:string; currency_code:string; income:number; expenses:number; balance:number; previous_income:number; previous_expenses:number; previous_balance:number; monthly:ReportMonth[]; categories:ReportCategory[] };

function client(){if(!supabase)throw new Error("Supabase no está configurado.");return supabase;}
const numeric=(value:unknown)=>Number(value??0);

export function parseReports(value:unknown):ReportsOverview{const payload=value as ReportsOverview;return{...payload,income:numeric(payload.income),expenses:numeric(payload.expenses),balance:numeric(payload.balance),previous_income:numeric(payload.previous_income),previous_expenses:numeric(payload.previous_expenses),previous_balance:numeric(payload.previous_balance),monthly:(payload.monthly??[]).map((m)=>({...m,income:numeric(m.income),expenses:numeric(m.expenses),balance:numeric(m.balance)})),categories:(payload.categories??[]).map((c)=>({...c,amount:numeric(c.amount),operations:numeric(c.operations)}))};}
export function periodComparison(current:number,previous:number){if(previous===0)return current===0?0:100;return (current-previous)/Math.abs(previous)*100;}
export function reportRows(data:ReportsOverview){return [["Tipo","Concepto","Importe","Operaciones"],...data.categories.map((item)=>[item.transaction_type==="income"?"Ingreso":"Gasto",item.category_name,String(item.amount),String(item.operations)]),["Resumen","Ingresos",String(data.income),""],["Resumen","Gastos",String(data.expenses),""],["Resumen","Balance",String(data.balance),""]];}
export function toCsv(rows:string[][]){return rows.map((row)=>row.map((cell)=>`"${cell.replaceAll("\"","\"\"")}"`).join(",")).join("\n");}
export async function loadReports(dateFrom:string,dateTo:string,currencyCode:string){const {data,error}=await client().rpc("get_reports_overview",{p_date_from:dateFrom,p_date_to:dateTo,p_currency_code:currencyCode});if(error)throw error;return parseReports(data);}
