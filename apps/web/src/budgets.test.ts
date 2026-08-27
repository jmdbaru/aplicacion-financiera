import { describe, expect, it } from "vitest";
import { monthStart, shiftMonth } from "./budgets";

describe("budget month helpers", () => {
  it("normaliza el primer día del mes", () => {
    expect(monthStart(new Date(2026, 7, 27))).toBe("2026-08-01");
  });

  it("cruza correctamente el cambio de año", () => {
    expect(shiftMonth("2026-01-01", -1)).toBe("2025-12-01");
    expect(shiftMonth("2026-12-01", 1)).toBe("2027-01-01");
  });
});
