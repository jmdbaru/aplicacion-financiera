import { describe, expect, it } from "vitest";
import { periodComparison, reportPeriodRange, reportRows, shiftReportPeriod, toCsv, type ReportsOverview } from "./reports";

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

  it("uses complete, local calendar periods at month and year limits", () => {
    expect(reportPeriodRange("day", new Date(2026, 1, 28, 12))).toEqual({ dateFrom: "2026-02-28", dateTo: "2026-02-28" });
    expect(reportPeriodRange("month", new Date(2024, 1, 29, 12))).toEqual({ dateFrom: "2024-02-01", dateTo: "2024-02-29" });
    expect(reportPeriodRange("year", new Date(2026, 8, 8, 12))).toEqual({ dateFrom: "2026-01-01", dateTo: "2026-12-31" });
  });

  it("moves weekly ranges by complete weeks across a month boundary", () => {
    expect(shiftReportPeriod("week", "2026-03-30", 1)).toEqual({ dateFrom: "2026-04-06", dateTo: "2026-04-12" });
  });
});
