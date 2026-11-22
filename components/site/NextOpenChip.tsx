"use client";

import { Icon } from "@/components/ui/Icon";
import { formatTime12, relativeDay, salonNow, splitStart } from "@/lib/domain/time";
import { useNextOpenSlot } from "@/lib/hooks/data";
import styles from "./NextOpenChip.module.css";

/** "Next open time" pulled live from the repo, so it changes when the owner confirms a booking. */
export function NextOpenChip() {
  const { data } = useNextOpenSlot(null);
  if (!data) return null;
  const { dateKey, time } = splitStart(data.start);
  return (
    <div className={styles.chip} role="status">
      <span className={styles.icon}><Icon name="calendar" size={18} /></span>
      <span>
        <span className={styles.label}>Next open time</span>
        <strong>
          {relativeDay(dateKey, salonNow().dateKey)}, {formatTime12(time)}
        </strong>
      </span>
    </div>
  );
}
