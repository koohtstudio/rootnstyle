"use client";

import { useState } from "react";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { formatDayLong, formatDayShort, formatTime12, splitStart } from "@/lib/domain/time";
import { useOpenDays, useSlots } from "@/lib/hooks/data";
import styles from "./SlotPicker.module.css";

/** Day chips and time buttons for a service. Used for "Suggest another time" and "Move". */
export function SlotPicker({ serviceId, value, onChange }: { serviceId: string; value: string | null; onChange: (start: string | null) => void }) {
  const days = useOpenDays(serviceId);
  const [dateKey, setDateKey] = useState<string | null>(value ? splitStart(value).dateKey : null);
  const slots = useSlots(serviceId, dateKey);

  if (days.error) return <ErrorState title="We could not load open days" onRetry={days.refetch} />;
  if (days.loading) return <div className={styles.skels} role="status"><span className="sr-only">Loading days</span>{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} h={64} w={64} r={16} />)}</div>;

  return (
    <div className={styles.wrap}>
      <div className="chip-row" role="group" aria-label="Choose a day">
        {(days.data ?? []).map((d) => {
          const f = formatDayShort(d.dateKey);
          return (
            <button key={d.dateKey} type="button" className={styles.day} aria-pressed={dateKey === d.dateKey} disabled={d.free === 0} onClick={() => { setDateKey(d.dateKey); onChange(null); }}>
              <span>{f.weekday}</span><strong>{f.day}</strong><span>{f.month}</span>
            </button>
          );
        })}
      </div>
      {dateKey ? (
        slots.error ? <ErrorState title="We could not load times" onRetry={slots.refetch} /> :
        slots.loading ? <Skeleton h={44} /> : (
          <div className={styles.times} role="group" aria-label={`Times on ${formatDayLong(dateKey)}`}>
            {(slots.data ?? []).filter((s) => s.state !== "past").map((s) => (
              <button key={s.start} type="button" className={styles.time} aria-pressed={value === s.start} disabled={s.state !== "open"} aria-label={s.state === "open" ? formatTime12(s.time) : `${formatTime12(s.time)}, taken`} onClick={() => onChange(s.start)}>
                {formatTime12(s.time)}
              </button>
            ))}
          </div>
        )
      ) : <p className={styles.hint}>Pick a day to see times.</p>}
    </div>
  );
}
