import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
export type Goal = { id:string; name:string; target_amount:number; currency_code:string; target_date:string|null; status:string; contributed:number; remaining:number; progress_pct:number };
export type GoalContribution = { id:string; goal_id:string; amount:number; contributed_on:string; note:string|null };
function client(){if(!supabase)throw new Error("Supabase no está configurado.");return supabase;}
export async function loadGoals(){const {data,error}=await client().rpc("get_savings_goals_overview");if(error)throw error;return (data??[]).map((g:Goal)=>({...g,target_amount:Number(g.target_amount),contributed:Number(g.contributed),remaining:Number(g.remaining),progress_pct:Number(g.progress_pct)})) as Goal[];}
export async function createGoal(session:Session,name:string,amount:number,currency:string,date:string){const {error}=await client().from("savings_goals").insert({user_id:session.user.id,name:name.trim(),target_amount:amount,currency_code:currency,target_date:date||null});if(error)throw error;}
export async function contribute(session:Session,goalId:string,amount:number,note:string){const {error}=await client().from("goal_contributions").insert({user_id:session.user.id,goal_id:goalId,amount,note:note.trim()||null});if(error)throw error;}
export async function loadContributions(goalIds:string[]){if(!goalIds.length)return [];const {data,error}=await client().from("goal_contributions").select("id,goal_id,amount,contributed_on,note").in("goal_id",goalIds).order("contributed_on",{ascending:false});if(error)throw error;return (data??[]).map((row)=>({...row,amount:Number(row.amount)})) as GoalContribution[];}
export async function updateGoalStatus(session:Session,goalId:string,status:"active"|"completed"|"archived"){const {error}=await client().from("savings_goals").update({status}).eq("id",goalId).eq("user_id",session.user.id);if(error)throw error;}
