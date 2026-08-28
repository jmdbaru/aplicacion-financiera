import { describe, expect, it } from "vitest";
import { chartCeiling, parseDashboard } from "./dashboard";

describe("dashboard helpers", () => {
  it("convierte importes agregados antes de dibujarlos", () => {
    const result = parseDashboard({ period_start: "2026-08-01", currency_code: "EUR", available: "180", active_accounts: 1, income: "300", expenses: "120", balance: "180", budget: { total_budget: "0", budgeted_spent: "0", outside_budget_spent: "0", items: [] }, monthly: [{ period_start: "2026-08-01", income: "300", expenses: "120", balance: "180" }], recent_transactions: [] });
    expect(result.balance).toBe(180);
    expect(chartCeiling(result.monthly)).toBe(300);
  });
});
