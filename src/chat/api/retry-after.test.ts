import { describe, expect, test } from "bun:test";
import { retryAfterMs } from "./retry-after";

describe("Retry-After", () => {
  test("accepts delta-seconds including zero", () => {
    expect(retryAfterMs("3", 0)).toBe(3000);
    expect(retryAfterMs("0", 0)).toBe(0);
  });
  test("accepts HTTP dates and clamps past dates", () => {
    const now = Date.parse("Tue, 13 Oct 2026 12:00:00 GMT");
    expect(retryAfterMs("Tue, 13 Oct 2026 12:00:04 GMT", now)).toBe(4000);
    expect(retryAfterMs("Tue, 13 Oct 2026 11:59:00 GMT", now)).toBe(0);
  });
  test("rejects missing, negative, fractional and malformed delays", () => {
    for (const value of [
      null,
      "",
      "-1",
      "1.5",
      "tomorrow",
      "99999999999999999999999",
    ]) {
      expect(retryAfterMs(value, 0)).toBeNull();
    }
  });
});
