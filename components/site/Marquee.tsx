"use client";

import { usePublicServices } from "@/lib/hooks/data";
import styles from "./Marquee.module.css";

/** A decorative strip of service names. It stops moving when the visitor prefers reduced motion. */
export function Marquee() {
  const { data } = usePublicServices();
  const names = (data ?? []).map((s) => s.name);
  if (names.length === 0) return null;
  const row = (hidden: boolean) => (
    <ul className={styles.row} aria-hidden={hidden || undefined}>
      {names.map((n) => (
        <li key={n}>
          <span className={styles.star} aria-hidden="true">&#10022;</span> {n}
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`${styles.marquee} on-dark`} aria-hidden="true">
      <div className={styles.track} data-testid="marquee-track">
        {row(false)}
        <div className={styles.copy}>{row(true)}</div>
      </div>
    </div>
  );
}
