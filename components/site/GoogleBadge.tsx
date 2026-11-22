"use client";

import { Confirm } from "@/components/ui/Confirm";
import { Stars } from "@/components/ui/Stars";
import { GOOGLE } from "@/lib/domain/content";
import styles from "./GoogleBadge.module.css";

export function GoogleBadge() {
  return (
    <p className={styles.badge}>
      <Stars rating={GOOGLE.rating} size={16} />
      <span>
        <strong>{GOOGLE.rating}</strong> on Google, {GOOGLE.count} reviews
      </span>
      <Confirm what="current numbers at launch" />
    </p>
  );
}
