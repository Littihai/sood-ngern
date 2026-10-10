import { describe, expect, it } from "vitest";
import { isValidPhotoURL, safeDisplayName, safePhotoURL, validateProfile } from "../../src/lib/profile";

describe("isValidPhotoURL (mirrors firestore.rules)", () => {
  it("accepts empty and http(s) URLs", () => {
    expect(isValidPhotoURL("")).toBe(true);
    expect(isValidPhotoURL("https://example.com/me.jpg")).toBe(true);
    expect(isValidPhotoURL("http://example.com/me.jpg")).toBe(true);
  });
  it("rejects other schemes, bare text and over-long URLs", () => {
    expect(isValidPhotoURL("abc")).toBe(false);
    expect(isValidPhotoURL("javascript:alert(1)")).toBe(false);
    expect(isValidPhotoURL("ftp://example.com/a.jpg")).toBe(false);
    expect(isValidPhotoURL("HTTPS://example.com")).toBe(false); // the rule is case-sensitive
    expect(isValidPhotoURL("https://x.example/" + "a".repeat(500))).toBe(false);
  });
});

describe("validateProfile", () => {
  it("returns no errors for valid input", () => {
    expect(validateProfile({ displayName: "Alice", photoURL: "https://example.com/a.png" })).toEqual({});
    expect(validateProfile({ displayName: "", photoURL: "" })).toEqual({});
  });
  it("flags a name over 100 characters and a bad link", () => {
    const r = validateProfile({ displayName: "ก".repeat(101), photoURL: "abc" });
    expect(r.displayName).toBeTruthy();
    expect(r.photoURL).toMatch(/http/);
  });
  it("does not count surrounding whitespace", () => {
    expect(validateProfile({ displayName: "  " + "a".repeat(100) + "  ", photoURL: "  https://e.co/a  " })).toEqual({});
  });
});

describe("safeDisplayName / safePhotoURL", () => {
  it("falls back to the e-mail, then to a placeholder", () => {
    expect(safeDisplayName({ displayName: "Bob", email: "b@e.co" })).toBe("Bob");
    expect(safeDisplayName({ displayName: null, email: "b@e.co" })).toBe("b@e.co");
    expect(safeDisplayName({ displayName: "   ", email: null })).toBe("Unknown user");
    expect(safeDisplayName(undefined)).toBe("Unknown user");
  });
  it("never exceeds the 100 character limit", () => {
    expect(safeDisplayName({ displayName: "N".repeat(250), email: null })).toHaveLength(100);
  });
  it("drops photo URLs the server would reject", () => {
    expect(safePhotoURL("https://e.co/a.jpg")).toBe("https://e.co/a.jpg");
    expect(safePhotoURL("abc")).toBe("");
    expect(safePhotoURL(null)).toBe("");
    expect(safePhotoURL("https://e.co/" + "a".repeat(600))).toBe("");
  });
});
