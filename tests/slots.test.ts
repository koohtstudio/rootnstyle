import { describe, expect, it } from "vitest";
import { seedHours } from "@/lib/mock/seed";
import { generateSlots, hasClash, isSlotFree, listOpenDays, nextOpenSlot, overlaps, type SlotContext } from "@/lib/domain/slots";

const hours = seedHours();
// Monday 2026-11-23 at 08:00, so Tuesday the 24th is the first open day.
const base: SlotContext = { hours, occupied: [], now: { dateKey: "2026-11-23", minutes: 8 * 60 } };

describe("slot generation", () => {
  it("makes 30 minute slots inside Tue to Sat hours", () => {
    const s = generateSlots("2026-11-24", 30, base);
    expect(s[0]?.time).toBe("10:00");
    expect(s[s.length - 1]?.time).toBe("18:30");
    expect(s.length).toBe(18);
    expect(s.every((x) => x.state === "open")).toBe(true);
  });

  it("stops early so a longer service still ends by closing time", () => {
    const s = generateSlots("2026-11-24", 90, base);
    expect(s[s.length - 1]?.time).toBe("17:30");
  });

  it("closes Sunday at 6 and gives nothing on Monday", () => {
    const sun = generateSlots("2026-11-29", 30, base);
    expect(sun[sun.length - 1]?.time).toBe("17:30");
    expect(generateSlots("2026-11-23", 30, base)).toEqual([]);
  });

  it("marks overlapping confirmed bookings as booked, including the tail of a long one", () => {
    const ctx = { ...base, occupied: [{ start: "2026-11-24T14:00", durationMin: 60 }] };
    const s = generateSlots("2026-11-24", 30, ctx);
    const state = (t: string) => s.find((x) => x.time === t)?.state;
    expect(state("13:30")).toBe("open");
    expect(state("14:00")).toBe("booked");
    expect(state("14:30")).toBe("booked");
    expect(state("15:00")).toBe("open");
    // a 60 minute service starting 13:30 would run into the 14:00 booking
    const long = generateSlots("2026-11-24", 60, ctx);
    expect(long.find((x) => x.time === "13:30")?.state).toBe("booked");
    expect(long.find((x) => x.time === "13:00")?.state).toBe("open");
  });

  it("can exclude a booking so it can be moved onto its own time", () => {
    const ctx = { ...base, occupied: [{ id: "a", start: "2026-11-24T14:00", durationMin: 60 }] };
    expect(generateSlots("2026-11-24", 60, ctx, "a").every((x) => x.state === "open")).toBe(true);
  });

  it("hides the past and the next hour today", () => {
    const ctx = { ...base, now: { dateKey: "2026-11-24", minutes: 12 * 60 } };
    const s = generateSlots("2026-11-24", 30, ctx);
    expect(s.find((x) => x.time === "12:30")?.state).toBe("past");
    expect(s.find((x) => x.time === "13:00")?.state).toBe("open");
    expect(generateSlots("2026-11-23", 30, ctx)).toEqual([]);
  });

  it("checks a single start", () => {
    const ctx = { ...base, occupied: [{ start: "2026-11-24T10:00", durationMin: 30 }] };
    expect(isSlotFree("2026-11-24T10:00", 30, ctx)).toBe(false);
    expect(isSlotFree("2026-11-24T10:30", 30, ctx)).toBe(true);
    expect(isSlotFree("2026-11-24T09:30", 30, ctx)).toBe(false);
    expect(isSlotFree("2026-11-23T11:00", 30, ctx)).toBe(false);
  });
});

describe("open days", () => {
  it("lists 14 open days and skips Mondays", () => {
    const days = listOpenDays(base, 30);
    expect(days).toHaveLength(14);
    expect(days[0]?.dateKey).toBe("2026-11-24");
    expect(days.some((d) => new Date(`${d.dateKey}T12:00:00Z`).getUTCDay() === 1)).toBe(false);
  });

  it("drops today when the day is over", () => {
    const ctx = { ...base, now: { dateKey: "2026-11-24", minutes: 18 * 60 } };
    expect(listOpenDays(ctx, 30)[0]?.dateKey).toBe("2026-11-25");
  });

  it("counts free slots per day", () => {
    const ctx = { ...base, occupied: [{ start: "2026-11-24T10:00", durationMin: 60 }] };
    const first = listOpenDays(ctx, 30)[0];
    expect(first?.total).toBe(18);
    expect(first?.free).toBe(16);
  });

  it("finds the next open slot", () => {
    expect(nextOpenSlot(base, 30)?.start).toBe("2026-11-24T10:00");
    const ctx = { ...base, occupied: [{ start: "2026-11-24T10:00", durationMin: 30 }] };
    expect(nextOpenSlot(ctx, 30)?.start).toBe("2026-11-24T10:30");
  });
});

describe("clash maths", () => {
  it("detects overlap and touching edges", () => {
    expect(overlaps("2026-11-24T10:00", 60, "2026-11-24T10:30", 30)).toBe(true);
    expect(overlaps("2026-11-24T10:00", 60, "2026-11-24T11:00", 30)).toBe(false);
    expect(hasClash("2026-11-24T10:00", 30, [{ id: "x", start: "2026-11-24T10:00", durationMin: 30 }], "x")).toBe(false);
  });
});
