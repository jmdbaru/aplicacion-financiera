import { describe, expect, it } from "vitest";
import { calculateSettlementSuggestions, type SplitExpense, type SplitParticipant, type SplitSettlement } from "./splits";

const people:SplitParticipant[]=[{id:"ana",event_id:"event",name:"Ana"},{id:"luis",event_id:"event",name:"Luis"},{id:"maria",event_id:"event",name:"María"}];

describe("calculateSettlementSuggestions",()=>{
  it("reduce las deudas al mínimo de pagos necesario",()=>{
    const expenses:SplitExpense[]=[{id:"expense",event_id:"event",payer_id:"ana",description:"Hotel",amount:90,expense_date:"2026-09-02",participant_ids:["ana","luis","maria"]}];
    const result=calculateSettlementSuggestions(people,expenses,[]);
    expect(result).toHaveLength(2);
    expect(result.map((item)=>[item.payer.id,item.recipient.id,item.amount])).toEqual([["luis","ana",30],["maria","ana",30]]);
  });

  it("descuenta los pagos que ya se han marcado",()=>{
    const expenses:SplitExpense[]=[{id:"expense",event_id:"event",payer_id:"ana",description:"Hotel",amount:90,expense_date:"2026-09-02",participant_ids:["ana","luis","maria"]}];
    const settlements:SplitSettlement[]=[{id:"settlement",event_id:"event",payer_id:"luis",recipient_id:"ana",amount:30,settled_on:"2026-09-02"}];
    const result=calculateSettlementSuggestions(people,expenses,settlements);
    expect(result).toHaveLength(1);
    expect(result[0].payer.id).toBe("maria");
  });
});
