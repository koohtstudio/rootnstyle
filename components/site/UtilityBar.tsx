"use client";

import { Confirm } from "@/components/ui/Confirm";
import { Icon } from "@/components/ui/Icon";
import { INSTAGRAM_URL } from "@/lib/domain/content";
import { telHref } from "@/lib/domain/phone";
import { dayOfWeek, formatTime12, salonNow } from "@/lib/domain/time";
import { useHours, useSettings } from "@/lib/hooks/data";
import styles from "./UtilityBar.module.css";

export function UtilityBar() {
  const { data: settings } = useSettings();
  const { data: hours } = useHours();
  const today = hours?.find((h) => h.day === dayOfWeek(salonNow().dateKey));
  const todayText = !today ? "" : today.closed ? "Closed today" : `Open today ${formatTime12(today.open)} to ${formatTime12(today.close)}`;
  const c = settings?.contact;
  const street = c?.address.split(",").slice(0, 2).join(",");
  return (
    <aside className={`${styles.bar} on-dark`} aria-label="Salon details">
      <div className={`container ${styles.row}`}>
        <p className={styles.addr}>
          <Icon name="pin" size={15} /> <span>{street}</span>
          <Confirm what="unit number" />
        </p>
        <p className={styles.hours} suppressHydrationWarning>
          <Icon name="clock" size={15} /> <span>{todayText}</span>
        </p>
        <p className={styles.links}>
          {c ? (
            <a href={telHref(c.phone)}>
              <Icon name="phone" size={15} /> {c.phone}
            </a>
          ) : null}
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
            <Icon name="instagram" size={15} /> <span className="sr-only">Instagram, opens in a new tab</span>
            <span aria-hidden="true">{c?.instagram || "@rootsnstyle"}</span>
          </a>
        </p>
      </div>
    </aside>
  );
}
