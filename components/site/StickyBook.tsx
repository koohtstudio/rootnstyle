"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./StickyBook.module.css";

/** Phone only: a Book online button that stays in reach. */
export function StickyBook() {
  const path = usePathname();
  if (path === "/book") return null;
  return (
    <aside className={styles.bar} aria-label="Quick booking">
      <Link href="/book" className="btn btn-primary">
        Book online
      </Link>
    </aside>
  );
}
