import { describe, expect, it } from "vitest";
import { parseInvestments, returnPct, type InvestmentPosition } from "./investments";

describe("investment helpers", () => {
  it("parses numeric values from rpc payload", () => {
    const parsed = parseInvestments({ total_market_value: "110", total_cost_basis: "100", total_result: "10", positions: [] });
    expect(parsed.total_result).toBe(10);
  });

  it("calculates documented simple return percentage", () => {
    const position = { cost_basis: 100, unrealized_result: 12 } as InvestmentPosition;
    expect(returnPct(position)).toBe(12);
  });
});
