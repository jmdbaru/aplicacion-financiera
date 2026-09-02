import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type TransactionLibraryItem = { id:string; description:string; transaction_type:"income"|"expense"; category_id:string|null; default_amount:number|null; created_at:string };
const client=()=>{if(!supabase)throw new Error("Supabase no está configurado.");return supabase;};

export async function loadTransactionLibrary(session:Session,type:"income"|"expense",page:number){
 const pageSize=10;const {data,error,count}=await client().from("transaction_library_items").select("id,description,transaction_type,category_id,default_amount,created_at",{count:"exact"}).eq("user_id",session.user.id).eq("transaction_type",type).order("created_at",{ascending:false}).range(page*pageSize,page*pageSize+pageSize-1);
 if(error)throw error;return {rows:(data??[]).map((item)=>({...item,default_amount:item.default_amount===null?null:Number(item.default_amount)})) as TransactionLibraryItem[],count:count??0};
}

export async function saveTransactionLibraryItem(session:Session,input:Omit<TransactionLibraryItem,"id"|"created_at">){
 const {error}=await client().from("transaction_library_items").insert({...input,user_id:session.user.id,description:input.description.trim()});if(error)throw error;
}
