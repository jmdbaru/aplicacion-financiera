import { describe, expect, it } from "vitest";
import { calculateWealthTotals, type WealthItem } from "./wealth";

const base: Omit<WealthItem, "id" | "name" | "item_type" | "latest_amount" | "change_amount"> = {
  category: "other",
  currency_code: "EUR",
  notes: null,
  is_active: true,
  latest_date: "2026-08-31",
  previous_amount: null,
};

describe("calculateWealthTotals", () => {
  it("separates assets, liabilities and net worth", () => {
    const totals = calculateWealthTotals([
      { ...base, id: "a", name: "Casa", item_type: "asset", latest_amount: 200000, change_amount: 5000 },
      { ...base, id: "b", name: "Hipoteca", item_type: "liability", latest_amount: 120000, change_amount: -1000 },
    ]);

    expect(totals).toEqual({ assets: 200000, liabilities: 120000, net: 80000, change: 6000 });
  });

  it("ignores archived positions", () => {
    const totals = calculateWealthTotals([
      { ...base, id: "a", name: "Coche", item_type: "asset", latest_amount: 10000, change_amount: 0, is_active: false },
    ]);

    expect(totals.net).toBe(0);
  });
});
