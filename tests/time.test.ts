import { describe, expect, it } from "vitest";
import {
  addDays, dayOfWeek, formatDayLong, formatStartHuman, formatTime12, fromMinutes, makeStart,
  relativeDay, salonNow, splitStart, startOfWeekMonday, toMinutes, absMinutes,
} from "@/lib/domain/time";

describe("time helpers", () => {
  it("reads now in Toronto, not UTC", () => {
    // 03:00 UTC on Nov 24 is 22:00 on Nov 23 in Toronto (EST, UTC-5)
    expect(salonNow(new Date("2026-11-24T03:00:00Z"))).toEqual({ dateKey: "2026-11-23", minutes: 22 * 60 });
    // Summer time: 03:30 UTC on Jul 2 is 23:30 on Jul 1 (EDT, UTC-4)
    expect(salonNow(new Date("2026-07-02T03:30:00Z"))).toEqual({ dateKey: "2026-07-01", minutes: 23 * 60 + 30 });
  });

  it("does date maths without drift across months and DST changes", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-03-07", 2)).toBe("2026-03-09");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("knows the weekday", () => {
    expect(dayOfWeek("2026-11-22")).toBe(0); // Sunday
    expect(dayOfWeek("2026-11-23")).toBe(1); // Monday
    expect(dayOfWeek("2026-11-24")).toBe(2);
    expect(startOfWeekMonday("2026-11-22")).toBe("2026-11-16");
    expect(startOfWeekMonday("2026-11-23")).toBe("2026-11-23");
  });

  it("converts and formats times", () => {
    expect(toMinutes("14:30")).toBe(870);
    expect(fromMinutes(870)).toBe("14:30");
    expect(formatTime12("10:00")).toBe("10 am");
    expect(formatTime12("12:00")).toBe("12 pm");
    expect(formatTime12("00:30")).toBe("12:30 am");
    expect(formatTime12("14:30")).toBe("2:30 pm");
  });

  it("splits and formats a start", () => {
    const s = makeStart("2026-11-24", "14:30");
    expect(s).toBe("2026-11-24T14:30");
    expect(splitStart(s)).toEqual({ dateKey: "2026-11-24", time: "14:30" });
    expect(formatStartHuman(s)).toBe("Tue, Nov 24 at 2:30 pm");
    expect(formatDayLong("2026-11-24")).toBe("Tuesday, November 24");
    expect(absMinutes("2026-11-24T00:30") - absMinutes("2026-11-23T23:30")).toBe(60);
  });

  it("labels relative days", () => {
    expect(relativeDay("2026-11-24", "2026-11-24")).toBe("Today");
    expect(relativeDay("2026-11-25", "2026-11-24")).toBe("Tomorrow");
    expect(relativeDay("2026-11-28", "2026-11-24")).toBe("Sat, Nov 28");
  });
});
