import { describe, expect, it } from "vitest";
import { csvText, transactionsToCsv } from "../../src/lib/csv";

describe("csvText", () => {
  it("quotes and escapes embedded quotes", () => {
    expect(csvText('say "hi", ok')).toBe('"say ""hi"", ok"');
  });
  it.each(["=1+1", "+1", "-1", "@SUM(A1)", "\tcmd", "\rcmd", '=HYPERLINK("http://evil.example","x")'])(
    "neutralises spreadsheet formulas: %j",
    (value) => {
      expect(csvText(value).startsWith(`"'`)).toBe(true);
    }
  );
  it("leaves ordinary text untouched (including Thai)", () => {
    expect(csvText("กาแฟตอนเช้า")).toBe('"กาแฟตอนเช้า"');
    expect(csvText("2026-10-09")).toBe('"2026-10-09"');
  });
});

describe("transactionsToCsv", () => {
  const rows = [
    { date: "2026-10-01", type: "expense", category: "food", amount: 85, note: "=cmd" },
    { date: "2026-10-09", type: "income", category: "salary", amount: 32000, note: "เงินเดือน" },
  ];
  it("starts with a BOM, has a header, newest first", () => {
    const csv = transactionsToCsv(rows);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv.slice(1).split("\r\n");
    expect(lines[0]).toBe("date,type,category,amount,note");
    expect(lines[1]).toContain("2026-10-09");
    expect(lines[2]).toContain("2026-10-01");
  });
  it("writes amounts as plain numbers and neutralises notes", () => {
    const csv = transactionsToCsv(rows);
    expect(csv).toContain(',32000,"เงินเดือน"');
    expect(csv).toContain(`,85,"'=cmd"`);
  });
});
