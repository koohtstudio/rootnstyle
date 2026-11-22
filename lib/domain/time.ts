// Salon wall-clock time helpers. Every booking time is a plain string in the salon's
// own zone, so no timezone maths happens in the booking path.

export const SALON_TZ = "America/Toronto";

/** YYYY-MM-DD */
export type DateKey = string;
/** HH:mm, 24 hour */
export type TimeStr = string;
/** YYYY-MM-DDTHH:mm, salon local */
export type StartStr = string;

export interface SalonNow {
  dateKey: DateKey;
  minutes: number;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const weekdayName = (dow: number): string => WEEKDAYS[dow] ?? "";
export const weekdayShort = (dow: number): string => weekdayName(dow).slice(0, 3);

export function salonNow(date: Date = new Date()): SalonNow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SALON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const hour = Number(get("hour")) % 24;
  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: hour * 60 + Number(get("minute")),
  };
}

function parts(k: DateKey): [number, number, number] {
  const [y, m, d] = k.split("-").map(Number);
  return [y ?? 1970, m ?? 1, d ?? 1];
}

/** Days since 1970-01-01 for a date key (UTC, so no DST surprises). */
export function dayNumber(k: DateKey): number {
  const [y, m, d] = parts(k);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function fromDayNumber(n: number): DateKey {
  const dt = new Date(n * 86_400_000);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const addDays = (k: DateKey, n: number): DateKey => fromDayNumber(dayNumber(k) + n);

/** 0 = Sunday */
export function dayOfWeek(k: DateKey): number {
  return (((dayNumber(k) + 4) % 7) + 7) % 7;
}

/** Monday of the week that contains k. */
export function startOfWeekMonday(k: DateKey): DateKey {
  const dow = dayOfWeek(k);
  return addDays(k, dow === 0 ? -6 : 1 - dow);
}

export const toMinutes = (t: TimeStr): number => {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

export const fromMinutes = (n: number): TimeStr =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

export const makeStart = (k: DateKey, t: TimeStr): StartStr => `${k}T${t}`;

export function splitStart(s: StartStr): { dateKey: DateKey; time: TimeStr } {
  const [dateKey = "", time = "00:00"] = s.split("T");
  return { dateKey, time };
}

/** Absolute minutes since epoch (salon local), for overlap checks. */
export function absMinutes(s: StartStr): number {
  const { dateKey, time } = splitStart(s);
  return dayNumber(dateKey) * 1440 + toMinutes(time);
}

export const compareStart = (a: StartStr, b: StartStr): number => (a < b ? -1 : a > b ? 1 : 0);

/** "14:30" -> "2:30 pm" */
export function formatTime12(t: TimeStr): string {
  const mins = toMinutes(t);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h24 >= 12 ? "pm" : "am";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h} ${suffix}` : `${h}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatDayShort(k: DateKey): { weekday: string; day: string; month: string } {
  const [, m, d] = parts(k);
  return {
    weekday: weekdayShort(dayOfWeek(k)),
    day: String(d),
    month: (MONTHS[m - 1] ?? "").slice(0, 3),
  };
}

/** "Tuesday, November 24" */
export function formatDayLong(k: DateKey): string {
  const [, m, d] = parts(k);
  return `${weekdayName(dayOfWeek(k))}, ${MONTHS[m - 1] ?? ""} ${d}`;
}

/** "Tue, Nov 24 at 2:30 pm" */
export function formatStartHuman(s: StartStr): string {
  const { dateKey, time } = splitStart(s);
  const f = formatDayShort(dateKey);
  return `${f.weekday}, ${f.month} ${f.day} at ${formatTime12(time)}`;
}

/** "Today", "Tomorrow" or "Tue, Nov 24" */
export function relativeDay(k: DateKey, today: DateKey): string {
  const diff = dayNumber(k) - dayNumber(today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  const f = formatDayShort(k);
  return `${f.weekday}, ${f.month} ${f.day}`;
}

export const START_RE = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** "Nov 22, 10:50 a.m." for an ISO timestamp, in salon time. */
export function formatStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-CA", { timeZone: SALON_TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
