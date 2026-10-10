/**
 * Limits mirrored from firestore.rules. Anything the rules reject must never be sent,
 * otherwise saving a transaction fails for a reason the user cannot see.
 */
export const MAX_NAME_LENGTH = 100;
export const MAX_URL_LENGTH = 500;

type NameSource = { displayName?: string | null; email?: string | null } | undefined;

/** `http://` or `https://` (case-sensitive, like the rules) and at most 500 characters. */
export function isValidPhotoURL(url: string): boolean {
  return url === "" || (url.length <= MAX_URL_LENGTH && /^https?:\/\//.test(url));
}

/** Validation for the profile form. Returns Thai messages, or an empty object when valid. */
export function validateProfile(input: { displayName: string; photoURL: string }): { displayName?: string; photoURL?: string } {
  const errors: { displayName?: string; photoURL?: string } = {};
  if (input.displayName.trim().length > MAX_NAME_LENGTH) errors.displayName = `ชื่อต้องไม่เกิน ${MAX_NAME_LENGTH} ตัวอักษร`;
  const url = input.photoURL.trim();
  if (url.length > MAX_URL_LENGTH) errors.photoURL = `ลิงก์ต้องไม่เกิน ${MAX_URL_LENGTH} ตัวอักษร`;
  else if (!isValidPhotoURL(url)) errors.photoURL = "ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://";
  return errors;
}

/** Name stored on transactions/members: never empty, never longer than the rules allow. */
export function safeDisplayName(source: NameSource): string {
  const name = (source?.displayName || source?.email || "Unknown user").trim() || "Unknown user";
  return name.slice(0, MAX_NAME_LENGTH);
}

/** Photo URL stored on transactions/members: invalid or oversized values become "" (no photo). */
export function safePhotoURL(url: string | null | undefined): string {
  const value = (url ?? "").trim();
  return isValidPhotoURL(value) ? value : "";
}
