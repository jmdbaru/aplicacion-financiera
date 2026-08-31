import { describe, expect, it } from "vitest";
import { normalizeImportRows, parseCsv, splitCsvLine } from "./imports";

describe("import helpers", () => {
  it("parses quoted CSV lines", () => {
    expect(splitCsvLine('"2026-08-31","Compra, mercado",-12.5')).toEqual(["2026-08-31", "Compra, mercado", "-12.5"]);
  });

  it("normalizes rows and detects duplicates", () => {
    const rows = parseCsv("fecha,concepto,importe\n2026-08-31,Mercado,-12.5\n2026-08-31,Mercado,-12.5");
    const preview = normalizeImportRows(rows);

    expect(preview[0].status).toBe("ready");
    expect(preview[0].transaction_type).toBe("expense");
    expect(preview[1].status).toBe("duplicate");
  });
});
