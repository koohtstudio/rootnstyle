import type { Hours, Service } from "./schemas";
import {
  absMinutes,
  addDays,
  dayOfWeek,
  fromMinutes,
  makeStart,
  splitStart,
  toMinutes,
  type DateKey,
  type SalonNow,
  type StartStr,
} from "./time";

export const SLOT_STEP_MIN = 30;
/** Used for slot maths when a service has no duration yet. */
export const DEFAULT_DURATION_MIN = 60;
export const OPEN_DAYS_AHEAD = 14;
/** Slots starting sooner than this from now are not offered online. */
export const LEAD_TIME_MIN = 60;

export interface Occupied {
  id?: string;
  start: StartStr;
  durationMin: number;
}

export interface SlotContext {
  hours: Hours[];
  /** Confirmed bookings only. New requests do not block a slot. */
  occupied: Occupied[];
  now: SalonNow;
}

export type SlotState = "open" | "booked" | "past";

export interface Slot {
  time: string;
  start: StartStr;
  state: SlotState;
}

export interface DayAvailability {
  dateKey: DateKey;
  free: number;
  total: number;
}

export const durationOf = (service: Pick<Service, "durationMin"> | null | undefined): number =>
  service?.durationMin ?? DEFAULT_DURATION_MIN;

export function overlaps(aStart: StartStr, aDur: number, bStart: StartStr, bDur: number): boolean {
  const a = absMinutes(aStart);
  const b = absMinutes(bStart);
  return a < b + bDur && b < a + aDur;
}

export function hoursFor(hours: Hours[], dateKey: DateKey): Hours | undefined {
  const dow = dayOfWeek(dateKey);
  return hours.find((h) => h.day === dow);
}

export const isOpenDay = (hours: Hours[], dateKey: DateKey): boolean => {
  const h = hoursFor(hours, dateKey);
  return !!h && !h.closed;
};

/** Every 30 minute start on a day where the service still fits before closing. */
export function generateSlots(
  dateKey: DateKey,
  durationMin: number,
  ctx: SlotContext,
  excludeId?: string,
): Slot[] {
  const h = hoursFor(ctx.hours, dateKey);
  if (!h || h.closed) return [];
  const open = toMinutes(h.open);
  const close = toMinutes(h.close);
  const blockers = ctx.occupied.filter((o) => !excludeId || o.id !== excludeId);
  const slots: Slot[] = [];
  for (let t = open; t + durationMin <= close; t += SLOT_STEP_MIN) {
    const time = fromMinutes(t);
    const start = makeStart(dateKey, time);
    let state: SlotState = "open";
    const isPastDay = dateKey < ctx.now.dateKey;
    const tooSoon = dateKey === ctx.now.dateKey && t < ctx.now.minutes + LEAD_TIME_MIN;
    if (isPastDay || tooSoon) state = "past";
    else if (blockers.some((o) => overlaps(start, durationMin, o.start, o.durationMin))) state = "booked";
    slots.push({ time, start, state });
  }
  return slots;
}

/** True when the exact start is a real open slot for this duration. */
export function isSlotFree(start: StartStr, durationMin: number, ctx: SlotContext, excludeId?: string): boolean {
  const { dateKey, time } = splitStart(start);
  return generateSlots(dateKey, durationMin, ctx, excludeId).some((s) => s.time === time && s.state === "open");
}

/** Whether a confirmed booking could be placed here ignoring lead time (admin moves and confirms). */
export function hasClash(start: StartStr, durationMin: number, occupied: Occupied[], excludeId?: string): boolean {
  return occupied.some((o) => o.id !== excludeId && overlaps(start, durationMin, o.start, o.durationMin));
}

/** The next `count` open days, starting today when there is still time left today. */
export function listOpenDays(ctx: SlotContext, durationMin: number, count = OPEN_DAYS_AHEAD): DayAvailability[] {
  const days: DayAvailability[] = [];
  for (let i = 0; i < 60 && days.length < count; i++) {
    const dateKey = addDays(ctx.now.dateKey, i);
    if (!isOpenDay(ctx.hours, dateKey)) continue;
    const slots = generateSlots(dateKey, durationMin, ctx);
    if (slots.length === 0) continue;
    if (i === 0 && slots.every((s) => s.state === "past")) continue;
    days.push({ dateKey, total: slots.length, free: slots.filter((s) => s.state === "open").length });
  }
  return days;
}

/** First open slot in the booking window, or null. */
export function nextOpenSlot(ctx: SlotContext, durationMin: number): Slot | null {
  for (const day of listOpenDays(ctx, durationMin)) {
    const slot = generateSlots(day.dateKey, durationMin, ctx).find((s) => s.state === "open");
    if (slot) return slot;
  }
  return null;
}
