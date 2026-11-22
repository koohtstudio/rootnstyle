"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { formatPhone, telHref } from "@/lib/domain/phone";
import type { Booking } from "@/lib/domain/schemas";
import { durationOf } from "@/lib/domain/slots";
import { addDays, DATE_RE, formatDayLong, formatDayShort, formatStartHuman, formatTime12, fromMinutes, salonNow, splitStart, startOfWeekMonday, toMinutes } from "@/lib/domain/time";
import { useAllServices, useBookings, useHours, useRepo } from "@/lib/hooks/data";
import { errorMessage } from "@/lib/repo/errors";
import { PageHead } from "./AdminUI";
import { SlotPicker } from "./SlotPicker";
import styles from "./Calendar.module.css";

const ROW = 30; // px per half hour

export function CalendarView() {
  const router = useRouter();
  const params = useSearchParams();
  const repo = useRepo();
  const toast = useToast();
  const bookings = useBookings({ status: "confirmed" });
  const services = useAllServices();
  const hours = useHours();
  const today = salonNow().dateKey;
  const weekParam = params.get("week");
  // With no ?week=, show this week, or the first week that actually has a confirmed booking coming up.
  const upcoming = (bookings.data ?? []).filter((b) => splitStart(b.start).dateKey >= today).sort((a, b) => (a.start < b.start ? -1 : 1));
  const thisWeek = startOfWeekMonday(today);
  const hasThisWeek = upcoming.some((b) => startOfWeekMonday(splitStart(b.start).dateKey) === thisWeek);
  const fallback = upcoming[0] && !hasThisWeek ? startOfWeekMonday(splitStart(upcoming[0].start).dateKey) : thisWeek;
  const week = weekParam && DATE_RE.test(weekParam) ? startOfWeekMonday(weekParam) : fallback;

  const [openId, setOpenId] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "move" | "cancel">("view");
  const [pick, setPick] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => [1, 2, 3, 4, 5, 6].map((n) => addDays(week, n)), [week]); // Tue to Sun
  const goWeek = (w: string) => router.replace(`/admin/calendar?week=${w}`, { scroll: false });

  if (bookings.error) return <><PageHead title="Calendar" /><ErrorState onRetry={bookings.refetch} /></>;
  if (bookings.loading || !bookings.data || !hours.data) {
    return <><PageHead title="Calendar" /><div role="status"><span className="sr-only">Loading calendar</span><Skeleton h={420} r={24} /></div></>;
  }

  const svc = (id: string) => services.data?.find((s) => s.id === id);
  const open = hours.data.filter((h) => !h.closed);
  const gridStart = Math.min(...open.map((h) => toMinutes(h.open)), 600);
  const gridEnd = Math.max(...open.map((h) => toMinutes(h.close)), 1140);
  const rows = Math.ceil((gridEnd - gridStart) / 30);
  const times = Array.from({ length: rows }, (_, i) => gridStart + i * 30);

  const byDay = (d: string) => bookings.data!.filter((b) => splitStart(b.start).dateKey === d).sort((a, b) => (a.start < b.start ? -1 : 1));
  const selected = bookings.data.find((b) => b.id === openId) ?? null;
  const rangeLabel = `${formatDayLong(days[0]!)} to ${formatDayLong(days[5]!)}`;

  const close = () => { setOpenId(null); setMode("view"); setPick(null); setError(null); };
  const openBooking = (b: Booking) => { setOpenId(b.id); setMode("view"); setPick(null); setError(null); };

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setError(null);
    try { await fn(); toast.show(ok); close(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }

  const block = (b: Booking) => {
    const s = svc(b.serviceId);
    const { time } = splitStart(b.start);
    const top = ((toMinutes(time) - gridStart) / 30) * ROW;
    const height = Math.max(1, durationOf(s) / 30) * ROW - 3;
    return (
      <button key={b.id} type="button" className={styles.block} style={{ top, height }} onClick={() => openBooking(b)}>
        <strong>{b.name}</strong>
        <span>{s?.name}</span>
        <span>{formatTime12(time)}</span>
      </button>
    );
  };

  return (
    <>
      <PageHead
        title="Calendar"
        actions={
          <div className={styles.nav}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => goWeek(addDays(week, -7))} aria-label="Previous week"><Icon name="left" size={18} /></button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => goWeek(startOfWeekMonday(today))}>This week</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => goWeek(addDays(week, 7))} aria-label="Next week"><Icon name="right" size={18} /></button>
          </div>
        }
      >
        Confirmed bookings, Tuesday to Sunday. Monday is closed.
      </PageHead>
      <p className={styles.range} aria-live="polite">{rangeLabel}</p>

      {/* wide screens: week grid */}
      <div className={styles.gridWrap}>
        <div className={styles.grid} style={{ ["--rows" as string]: rows, ["--row" as string]: `${ROW}px` }} role="group" aria-label="Week calendar">
          <div className={styles.corner} />
          {days.map((d) => {
            const f = formatDayShort(d);
            return <div key={d} className={`${styles.dhead} ${d === today ? styles.todayHead : ""}`}><span>{f.weekday}</span><strong>{f.day}</strong></div>;
          })}
          <div className={styles.times}>
            {times.map((t) => <span key={t} style={{ height: ROW }}>{t % 60 === 0 ? formatTime12(fromMinutes(t)) : ""}</span>)}
          </div>
          {days.map((d) => {
            const dow = new Date(`${d}T12:00:00Z`).getUTCDay();
            const h = hours.data!.find((x) => x.day === dow);
            const openMin = h && !h.closed ? toMinutes(h.open) : gridEnd;
            const closeMin = h && !h.closed ? toMinutes(h.close) : gridEnd;
            return (
              <div key={d} className={styles.day} data-date={d}>
                <span className={styles.shade} style={{ top: 0, height: ((openMin - gridStart) / 30) * ROW }} />
                <span className={styles.shade} style={{ top: ((closeMin - gridStart) / 30) * ROW, height: ((gridEnd - closeMin) / 30) * ROW }} />
                {byDay(d).map(block)}
              </div>
            );
          })}
        </div>
      </div>

      {/* phones and tablets: agenda */}
      <div className={styles.agenda}>
        {days.map((d) => {
          const list = byDay(d);
          return (
            <section key={d} className={styles.agendaDay}>
              <h2>{formatDayLong(d)}{d === today ? <span className={styles.todayTag}>Today</span> : null}</h2>
              {list.length === 0 ? <p className={styles.nothing}>Nothing booked.</p> : (
                <ul>
                  {list.map((b) => (
                    <li key={b.id}>
                      <button type="button" onClick={() => openBooking(b)}>
                        <span className={styles.at}>{formatTime12(splitStart(b.start).time)}</span>
                        <span><strong>{b.name}</strong><small>{svc(b.serviceId)?.name}</small></span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <Dialog
        open={!!selected}
        onClose={close}
        title={selected ? `${selected.name}` : "Booking"}
        variant="sheet"
        footer={
          selected && mode === "view" ? (
            <>
              <button type="button" className="btn btn-danger" onClick={() => setMode("cancel")}>Cancel booking</button>
              <button type="button" className="btn btn-ghost" onClick={() => setMode("move")}>Move</button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => run(() => repo.bookings.complete(selected.id), "Marked done.")}>Mark done</button>
            </>
          ) : selected && mode === "move" ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => { setMode("view"); setPick(null); }}>Back</button>
              <button type="button" className="btn btn-primary" disabled={!pick || busy} onClick={() => pick && run(() => repo.bookings.move(selected.id, pick), "Moved. The client was texted.")}>{busy ? "Moving" : "Move booking"}</button>
            </>
          ) : selected && mode === "cancel" ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setMode("view")}>Keep it</button>
              <button type="button" className="btn btn-danger" disabled={busy} onClick={() => run(() => repo.bookings.cancel(selected.id), "Cancelled. The slot is open again and the client was texted.")}>{busy ? "Cancelling" : "Yes, cancel it"}</button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className={styles.detail}>
            <dl>
              <div><dt>Service</dt><dd>{svc(selected.serviceId)?.name}</dd></div>
              <div><dt>When</dt><dd>{formatStartHuman(selected.start)}</dd></div>
              <div><dt>Phone</dt><dd><a href={telHref(selected.phone)}>{formatPhone(selected.phone)}</a></dd></div>
              {selected.note ? <div><dt>Note</dt><dd>{selected.note}</dd></div> : null}
            </dl>
            {mode === "move" ? (<><h3>Pick a new time</h3><SlotPicker serviceId={selected.serviceId} value={pick} onChange={setPick} /></>) : null}
            {mode === "cancel" ? <p>This frees the slot on the website and texts {selected.name.split(" ")[0]}. Cancel this booking?</p> : null}
            {error ? <p className={styles.err} role="alert"><Icon name="alert" size={18} /> {error}</p> : null}
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
