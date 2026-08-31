import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type WealthType = "asset" | "liability";
export type WealthCategory = "property" | "vehicle" | "investment" | "cash_equivalent" | "loan" | "mortgage" | "credit" | "other";
export type WealthItem = { id:string; name:string; item_type:WealthType; category:WealthCategory; currency_code:string; notes:string|null; is_active:boolean; latest_amount:number; latest_date:string|null; previous_amount:number|null; change_amount:number };
export type WealthValuation = { id:string; item_id:string; amount:number; valuation_date:string; source:string; note:string|null };

function client(){if(!supabase)throw new Error("Supabase no está configurado.");return supabase;}

export async function loadWealth(){const {data,error}=await client().rpc("get_wealth_overview");if(error)throw error;return (data??[]).map((row:WealthItem)=>({...row,latest_amount:Number(row.latest_amount),previous_amount:row.previous_amount===null?null:Number(row.previous_amount),change_amount:Number(row.change_amount)})) as WealthItem[];}
export async function createWealthItem(session:Session,item:{name:string; item_type:WealthType; category:WealthCategory; currency_code:string; notes:string; initial_value:number; valuation_date:string}){const {data,error}=await client().from("wealth_items").insert({user_id:session.user.id,name:item.name.trim(),item_type:item.item_type,category:item.category,currency_code:item.currency_code,notes:item.notes.trim()||null}).select("id").single();if(error)throw error;await addWealthValuation(session,data.id,item.initial_value,item.valuation_date,"Valor inicial");}
export async function addWealthValuation(session:Session,itemId:string,amount:number,date:string,note:string){const {error}=await client().from("wealth_valuations").upsert({user_id:session.user.id,item_id:itemId,amount,valuation_date:date||new Date().toISOString().slice(0,10),source:"manual",note:note.trim()||null},{onConflict:"user_id,item_id,valuation_date"});if(error)throw error;}
export async function loadWealthValuations(itemIds:string[]){if(!itemIds.length)return [];const {data,error}=await client().from("wealth_valuations").select("id,item_id,amount,valuation_date,source,note").in("item_id",itemIds).order("valuation_date",{ascending:false});if(error)throw error;return (data??[]).map((row)=>({...row,amount:Number(row.amount)})) as WealthValuation[];}
export async function setWealthItemActive(session:Session,itemId:string,isActive:boolean){const {error}=await client().from("wealth_items").update({is_active:isActive}).eq("id",itemId).eq("user_id",session.user.id);if(error)throw error;}
export function calculateWealthTotals(items:WealthItem[]){return items.filter((item)=>item.is_active).reduce((acc,item)=>{const direction=item.item_type==="asset"?1:-1;return{assets:acc.assets+(item.item_type==="asset"?item.latest_amount:0),liabilities:acc.liabilities+(item.item_type==="liability"?item.latest_amount:0),net:acc.net+(direction*item.latest_amount),change:acc.change+(direction*item.change_amount)};},{assets:0,liabilities:0,net:0,change:0});}
