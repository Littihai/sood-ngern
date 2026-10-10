/** Mirrors the limits enforced by firestore.rules so the form never sends a write the server will refuse. */

/** Typing filter: up to 9 integer digits and 2 decimals (rules require amount < 1,000,000,000). */
export const AMOUNT_PATTERN = /^\d{0,9}(\.\d{0,2})?$/;

/** `yyyy-mm-dd` that is a real calendar date (rejects 2026-02-31, 2026-13-45, ""). */
export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function validateTransactionInput(input: { amount: string; date: string }): { amount?: string; date?: string } {
  const errors: { amount?: string; date?: string } = {};
  const value = parseFloat(input.amount);
  if (!value || value <= 0) errors.amount = "กรุณากรอกจำนวนเงินมากกว่า 0";
  else if (value >= 1_000_000_000) errors.amount = "จำนวนเงินต้องน้อยกว่า 1,000,000,000 บาท";
  if (!isValidISODate(input.date)) errors.date = "กรุณาเลือกวันที่ให้ถูกต้อง";
  return errors;
}
