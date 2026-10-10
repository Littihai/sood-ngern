import { describe, expect, it } from "vitest";
import { AMOUNT_PATTERN, isValidISODate, validateTransactionInput } from "../../src/lib/transactionForm";

describe("AMOUNT_PATTERN (typing filter)", () => {
  it.each(["", "0", "12", "12.5", "12.34", "5.", ".5", "999999999", "999999999.99"])("allows %j", (v) => {
    expect(AMOUNT_PATTERN.test(v)).toBe(true);
  });
  it.each(["-5", "1e5", "12.345", "1,000", "٣", "9999999999", "a"])("blocks %j", (v) => {
    expect(AMOUNT_PATTERN.test(v)).toBe(false);
  });
});

describe("isValidISODate", () => {
  it("accepts real calendar dates, including leap days", () => {
    expect(isValidISODate("2026-10-09")).toBe(true);
    expect(isValidISODate("2028-02-29")).toBe(true);
  });
  it.each(["", "2026-13-01", "2026-02-30", "2027-02-29", "2026-00-10", "26-10-09", "2026/10/09", "abcd-ef-gh"])("rejects %j", (v) => {
    expect(isValidISODate(v)).toBe(false);
  });
});

describe("validateTransactionInput", () => {
  it("is valid for a normal entry", () => {
    expect(validateTransactionInput({ amount: "85.50", date: "2026-10-09" })).toEqual({});
  });
  it("rejects empty, zero and a cleared date", () => {
    expect(validateTransactionInput({ amount: "", date: "2026-10-09" }).amount).toBeTruthy();
    expect(validateTransactionInput({ amount: "0", date: "2026-10-09" }).amount).toBeTruthy();
    expect(validateTransactionInput({ amount: ".", date: "2026-10-09" }).amount).toBeTruthy();
    expect(validateTransactionInput({ amount: "10", date: "" }).date).toBeTruthy();
  });
  it("rejects amounts the rules refuse (>= 1,000,000,000)", () => {
    expect(validateTransactionInput({ amount: "1000000000", date: "2026-10-09" }).amount).toBeTruthy();
    expect(validateTransactionInput({ amount: "999999999.99", date: "2026-10-09" }).amount).toBeUndefined();
  });
});
