import { describe, expect, it } from "vitest";
import { formatPhone, isValidPhone, normalizePhone, telHref } from "@/lib/domain/phone";

describe("phone", () => {
  it("accepts common 10 digit formats", () => {
    for (const p of ["905 794 3373", "(905) 794-3373", "905-794-3373", "9057943373", "+1 905 794 3373", "1-905-794-3373"]) {
      expect(isValidPhone(p), p).toBe(true);
      expect(normalizePhone(p)).toBe("9057943373");
    }
  });
  it("rejects bad numbers", () => {
    for (const p of ["", "123", "905794337", "90579433733", "055 794 3373", "905 094 3373", "abc"]) {
      expect(isValidPhone(p), p).toBe(false);
    }
  });
  it("formats for display and dialing", () => {
    expect(formatPhone("9057943373")).toBe("(905) 794-3373");
    expect(formatPhone("nope")).toBe("nope");
    expect(telHref("905 794 3373")).toBe("tel:+19057943373");
  });
});
