import { describe, expect, it } from "vitest";
import { bookingInputSchema, bookingRequestSchema, galleryInputSchema, hoursSchema, serviceInputSchema, servicePatchSchema } from "@/lib/domain/schemas";

const ok = { serviceId: "haircuts", start: "2026-11-24T10:00", name: "  Sam Lee ", phone: "(905) 555-0123" };

describe("booking input", () => {
  it("trims, normalises the phone, and defaults marketing to off", () => {
    const r = bookingInputSchema.parse(ok);
    expect(r.name).toBe("Sam Lee");
    expect(r.phone).toBe("9055550123");
    expect(r.marketingOptIn).toBe(false);
    expect(r.email).toBeUndefined();
  });
  it("accepts an empty email and note", () => {
    const r = bookingInputSchema.parse({ ...ok, email: "", note: "  " });
    expect(r.email).toBeUndefined();
    expect(r.note).toBeUndefined();
  });
  it("rejects unknown fields", () => {
    expect(bookingInputSchema.safeParse({ ...ok, status: "confirmed" }).success).toBe(false);
  });
  it("rejects bad phone, email, start and long notes", () => {
    expect(bookingInputSchema.safeParse({ ...ok, phone: "12345" }).success).toBe(false);
    expect(bookingInputSchema.safeParse({ ...ok, email: "nope" }).success).toBe(false);
    expect(bookingInputSchema.safeParse({ ...ok, start: "tomorrow" }).success).toBe(false);
    expect(bookingInputSchema.safeParse({ ...ok, note: "x".repeat(501) }).success).toBe(false);
  });
  it("request schema carries the bot guards and still rejects strangers", () => {
    expect(bookingRequestSchema.safeParse({ ...ok, website: "", elapsedMs: 4000 }).success).toBe(true);
    expect(bookingRequestSchema.safeParse({ ...ok, website: "", elapsedMs: 4000, extra: 1 }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...ok, website: "" }).success).toBe(false);
  });
});

describe("other schemas", () => {
  it("service input defaults and bounds", () => {
    const s = serviceInputSchema.parse({ category: "hair", name: "Scalp massage" });
    expect(s.price).toBeNull();
    expect(s.visible).toBe(true);
    expect(serviceInputSchema.safeParse({ category: "nails", name: "Nails" }).success).toBe(false);
    expect(servicePatchSchema.safeParse({ price: 100000 }).success).toBe(false);
    expect(servicePatchSchema.safeParse({ id: "x" }).success).toBe(false);
  });
  it("gallery only takes local or data images", () => {
    const base = { title: "T", tag: "colour", alt: "Some alt text" };
    expect(galleryInputSchema.safeParse({ ...base, src: "/images/a.jpg" }).success).toBe(true);
    expect(galleryInputSchema.safeParse({ ...base, src: "data:image/jpeg;base64,AAAA" }).success).toBe(true);
    expect(galleryInputSchema.safeParse({ ...base, src: "https://example.com/a.jpg" }).success).toBe(false);
    expect(galleryInputSchema.safeParse({ ...base, src: "data:text/html;base64,AAAA" }).success).toBe(false);
  });
  it("hours need a close after the open", () => {
    expect(hoursSchema.safeParse({ day: 2, open: "10:00", close: "19:00", closed: false }).success).toBe(true);
    expect(hoursSchema.safeParse({ day: 2, open: "19:00", close: "10:00", closed: false }).success).toBe(false);
    expect(hoursSchema.safeParse({ day: 1, open: "19:00", close: "10:00", closed: true }).success).toBe(true);
  });
});
