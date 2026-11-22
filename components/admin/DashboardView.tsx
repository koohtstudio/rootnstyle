"use client";

import Link from "next/link";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { Stars } from "@/components/ui/Stars";
import { Icon } from "@/components/ui/Icon";
import { GOOGLE } from "@/lib/domain/content";
import { addDays, dayOfWeek, formatDayLong, formatDayShort, formatStartHuman, formatTime12, salonNow, splitStart, startOfWeekMonday } from "@/lib/domain/time";
import { useAllServices, useBookings, useHours } from "@/lib/hooks/data";
import { PageHead, Panel } from "./AdminUI";
import styles from "./Dashboard.module.css";

export function DashboardView() {
  const bookings = useBookings();
  const services = useAllServices();
  const hours = useHours();
  const now = salonNow();

  if (bookings.error) return <><PageHead title="Dashboard" /><ErrorState onRetry={bookings.refetch} /></>;
  if (bookings.loading || !bookings.data) {
    return (
      <>
        <PageHead title="Dashboard" />
        <div className={styles.stats} role="status"><span className="sr-only">Loading dashboard</span>{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={108} r={24} />)}</div>
        <div className={styles.cols}><Skeleton h={300} r={24} /><Skeleton h={300} r={24} /></div>
      </>
    );
  }

  const all = bookings.data;
  const svcName = (id: string) => services.data?.find((s) => s.id === id)?.name ?? "Service";
  // On a Sunday the working week is nearly over, so look ahead to the coming Tuesday to Sunday.
  const monday = dayOfWeek(now.dateKey) === 0 ? addDays(startOfWeekMonday(now.dateKey), 7) : startOfWeekMonday(now.dateKey);
  const weekDays = [1, 2, 3, 4, 5, 6].map((n) => addDays(monday, n)); // Tue to Sun
  const inWeek = (b: { start: string }) => weekDays.includes(splitStart(b.start).dateKey);

  const newOnes = all.filter((b) => b.status === "new");
  const needReply = newOnes.filter((b) => !b.suggestedStart).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const confirmedWeek = all.filter((b) => b.status === "confirmed" && inWeek(b)).length;
  const todayHours = hours.data?.find((h) => h.day === dayOfWeek(now.dateKey));
  const hoursText = !todayHours ? "" : todayHours.closed ? "Closed" : `${formatTime12(todayHours.open)} to ${formatTime12(todayHours.close)}`;

  const chart = weekDays.map((d) => {
    const day = all.filter((b) => splitStart(b.start).dateKey === d);
    return {
      d,
      booked: day.filter((b) => b.status === "confirmed" || b.status === "done").length,
      pending: day.filter((b) => b.status === "new").length,
    };
  });
  const max = Math.max(4, ...chart.map((c) => c.booked + c.pending));

  return (
    <>
      <PageHead title="Dashboard">{formatDayLong(now.dateKey)}. Here is what needs you today.</PageHead>

      <div className={styles.stats}>
        <Link href="/admin/requests?tab=new" className={`${styles.stat} ${styles.link}`}>
          <span className={styles.label}><Icon name="inbox" size={16} /> New requests</span>
          <span className={styles.value} data-testid="stat-new">{newOnes.length}</span>
          <span className={styles.foot}>{newOnes.length === 0 ? "All caught up" : "Waiting for you"}</span>
        </Link>
        <div className={styles.stat}>
          <span className={styles.label}><Icon name="calendar" size={16} /> Confirmed this week</span>
          <span className={styles.value} data-testid="stat-confirmed">{confirmedWeek}</span>
          <span className={styles.foot}>Tuesday to Sunday</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}><Icon name="sparkle" size={16} /> Google rating</span>
          <span className={styles.value}>{GOOGLE.rating}</span>
          <span className={styles.foot}><Stars rating={GOOGLE.rating} size={14} /> {GOOGLE.count} reviews</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}><Icon name="clock" size={16} /> Hours today</span>
          <span className={`${styles.value} ${styles.small}`}>{hoursText}</span>
          <span className={styles.foot}>{todayHours?.closed ? "Enjoy the day off" : "Open to online requests"}</span>
        </div>
      </div>

      <div className={styles.cols}>
        <Panel title="Appointments by day">
          <div className={styles.chart} role="img" aria-label={`Appointments this week: ${chart.map((c) => `${formatDayShort(c.d).weekday} ${c.booked + c.pending}`).join(", ")}`}>
            {chart.map((c) => (
              <div key={c.d} className={`${styles.col} ${c.d === now.dateKey ? styles.today : ""}`}>
                <span className={styles.num}>{c.booked + c.pending}</span>
                <div className={styles.bar}>
                  <span className={styles.pending} style={{ height: `${(c.pending / max) * 100}%` }} />
                  <span className={styles.booked} style={{ height: `${(c.booked / max) * 100}%` }} />
                </div>
                <span className={styles.day}>{formatDayShort(c.d).weekday}</span>
              </div>
            ))}
          </div>
          <ul className={styles.legend}>
            <li><i className={styles.kBooked} /> Confirmed or done</li>
            <li><i className={styles.kPending} /> New requests</li>
          </ul>
          <table className="sr-only">
            <caption>Appointments by day this week</caption>
            <thead><tr><th>Day</th><th>Confirmed or done</th><th>New</th></tr></thead>
            <tbody>{chart.map((c) => <tr key={c.d}><td>{formatDayLong(c.d)}</td><td>{c.booked}</td><td>{c.pending}</td></tr>)}</tbody>
          </table>
        </Panel>

        <Panel title="Needs a reply" action={<Link href="/admin/requests?tab=new" className="btn btn-ghost btn-sm">See all</Link>}>
          {needReply.length === 0 ? (
            <EmptyState icon="check" title="You are all caught up">New requests will show up here the moment they arrive.</EmptyState>
          ) : (
            <ul className={styles.reply}>
              {needReply.slice(0, 6).map((b) => (
                <li key={b.id}>
                  <Link href={`/admin/requests?tab=new&id=${b.id}`} className={styles.row}>
                    <span className={styles.avatar} aria-hidden="true">{b.name.charAt(0)}</span>
                    <span className={styles.rowText}>
                      <strong>{b.name}</strong>
                      <small>{svcName(b.serviceId)}, {formatStartHuman(b.start)}</small>
                    </span>
                    <Icon name="right" size={18} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
