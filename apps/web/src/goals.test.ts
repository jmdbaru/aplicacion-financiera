import { describe, expect, it } from "vitest";
import { goalRhythm } from "./goals";

describe("goal rhythm", () => {
  it("uses recent contributions as a neutral progress cue", () => {
    const today = new Date(2026, 8, 8, 12);
    expect(goalRhythm([], today)).toBe("Sin aportaciones en los últimos 30 días.");
    expect(goalRhythm([{ id: "1", goal_id: "g", amount: 10, contributed_on: "2026-08-20", note: null }], today)).toBe("Una aportación en los últimos 30 días.");
  });
});
