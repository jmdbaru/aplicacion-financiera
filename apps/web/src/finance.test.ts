import { describe, expect, it } from "vitest";
import { buildLedgerEntries, type FinancialAccount } from "./finance";

const checking: FinancialAccount = { id: "checking", name: "Principal", account_type: "bank", currency_code: "EUR", card_color: "emerald", is_active: true, balance: 0 };
const savings: FinancialAccount = { id: "savings", name: "Ahorro", account_type: "bank", currency_code: "EUR", card_color: "emerald", is_active: true, balance: 0 };

describe("buildLedgerEntries", () => {
  it("crea un gasto equilibrado con contrapartida externa", () => {
    const entries = buildLedgerEntries({ effectiveDate: "2026-08-27", description: "Compra", type: "expense", amount: 25, account: checking });
    expect(entries.map((entry) => entry.amount)).toEqual([-25, 25]);
    expect(entries.reduce((total, entry) => total + entry.amount, 0)).toBe(0);
  });

  it("crea una transferencia equilibrada entre cuentas", () => {
    const entries = buildLedgerEntries({ effectiveDate: "2026-08-27", description: "Ahorro", type: "transfer", amount: 100, account: checking, destination: savings });
    expect(entries.map((entry) => entry.account_id)).toEqual(["checking", "savings"]);
    expect(entries.reduce((total, entry) => total + entry.amount, 0)).toBe(0);
  });
});
