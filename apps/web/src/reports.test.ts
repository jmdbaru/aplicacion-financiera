import { describe, expect, it } from "vitest";
import { periodComparison, reportRows, toCsv, type ReportsOverview } from "./reports";

describe("reports helpers", () => {
  it("calculates period comparison with zero baseline", () => {
    expect(periodComparison(0, 0)).toBe(0);
    expect(periodComparison(50, 0)).toBe(100);
    expect(periodComparison(75, 100)).toBe(-25);
  });

  it("exports category rows as escaped CSV", () => {
    const data = {
      income: 100,
      expenses: 40,
      balance: 60,
      categories: [{ category_name: 'Casa "principal"', transaction_type: "expense", amount: 40, operations: 2 }],
    } as ReportsOverview;

    expect(toCsv(reportRows(data))).toContain('"Casa ""principal"""');
  });
});
