import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
export type SplitEvent={id:string;name:string;event_type:"trip"|"event"|"home"|"other";currency_code:string;notes:string|null;is_closed:boolean;created_at:string}; export type SplitParticipant={id:string;event_id:string;name:string}; export type SplitExpense={id:string;event_id:string;payer_id:string;description:string;amount:number;expense_date:string;participant_ids:string[]}; export type SplitSettlement={id:string;event_id:string;payer_id:string;recipient_id:string;amount:number;settled_on:string};
export type SettlementSuggestion={payer:SplitParticipant;recipient:SplitParticipant;amount:number};
const client=()=>{if(!supabase)throw new Error("Supabase no está configurado.");return supabase;};
export async function loadSplitEvents(session:Session){const {data,error}=await client().from("split_events").select("*").eq("user_id",session.user.id).order("created_at",{ascending:false});if(error)throw error;return(data??[])as SplitEvent[];}
export async function loadSplitDetail(session:Session,eventId:string){const [p,e,s]=await Promise.all([client().from("split_participants").select("id,event_id,name").eq("event_id",eventId).eq("user_id",session.user.id),client().from("split_expenses").select("id,event_id,payer_id,description,amount,expense_date,split_expense_participants(participant_id)").eq("event_id",eventId).eq("user_id",session.user.id).order("expense_date",{ascending:false}),client().from("split_settlements").select("id,event_id,payer_id,recipient_id,amount,settled_on").eq("event_id",eventId).eq("user_id",session.user.id).order("settled_on",{ascending:false})]);if(p.error)throw p.error;if(e.error)throw e.error;if(s.error)throw s.error;return{participants:(p.data??[])as SplitParticipant[],expenses:(e.data??[]).map((x:{id:string;event_id:string;payer_id:string;description:string;amount:number|string;expense_date:string;split_expense_participants:{participant_id:string}[]})=>({...x,amount:Number(x.amount),participant_ids:(x.split_expense_participants??[]).map(y=>y.participant_id)}))as SplitExpense[],settlements:(s.data??[]).map((item)=>({...item,amount:Number(item.amount)}))as SplitSettlement[]};}
export async function createSplitEvent(session:Session,input:Omit<SplitEvent,"id"|"is_closed"|"created_at">){const {data,error}=await client().from("split_events").insert({...input,user_id:session.user.id,name:input.name.trim()}).select().single();if(error)throw error;return data as SplitEvent;}
export async function addSplitParticipant(session:Session,eventId:string,name:string){const {error}=await client().from("split_participants").insert({event_id:eventId,user_id:session.user.id,name:name.trim()});if(error)throw error;}
export async function addSplitExpense(session:Session,input:{event_id:string;payer_id:string;description:string;amount:number;expense_date:string;participant_ids:string[]}){
  const { participant_ids, ...expense } = input;
  const {data,error}=await client().from("split_expenses").insert({...expense,user_id:session.user.id}).select("id").single();
  if(error)throw error;
  const {error:joinError}=await client().from("split_expense_participants").insert(participant_ids.map((participant_id)=>({expense_id:data.id,participant_id})));
  if(joinError)throw joinError;
}
export async function addSplitSettlement(session:Session,input:{event_id:string;payer_id:string;recipient_id:string;amount:number;settled_on:string}){const {error}=await client().from("split_settlements").insert({...input,user_id:session.user.id});if(error)throw error;}

export function calculateSettlementSuggestions(people:SplitParticipant[],expenses:SplitExpense[],settlements:SplitSettlement[]){
  const balances=new Map(people.map((person)=>[person.id,0]));
  for(const expense of expenses){balances.set(expense.payer_id,(balances.get(expense.payer_id)??0)+expense.amount);for(const participant of expense.participant_ids)balances.set(participant,(balances.get(participant)??0)-expense.amount/expense.participant_ids.length);}
  for(const settlement of settlements){balances.set(settlement.payer_id,(balances.get(settlement.payer_id)??0)+settlement.amount);balances.set(settlement.recipient_id,(balances.get(settlement.recipient_id)??0)-settlement.amount);}
  const debtors=people.map((person)=>({person,amount:Math.max(0,-(balances.get(person.id)??0))})).filter((item)=>item.amount>.005);
  const creditors=people.map((person)=>({person,amount:Math.max(0,balances.get(person.id)??0)})).filter((item)=>item.amount>.005);
  const suggestions:SettlementSuggestion[]=[];let debtor=0,creditor=0;
  while(debtors[debtor]&&creditors[creditor]){const amount=Math.min(debtors[debtor].amount,creditors[creditor].amount);suggestions.push({payer:debtors[debtor].person,recipient:creditors[creditor].person,amount});debtors[debtor].amount-=amount;creditors[creditor].amount-=amount;if(debtors[debtor].amount<.005)debtor++;if(creditors[creditor].amount<.005)creditor++;}
  return suggestions;
}
