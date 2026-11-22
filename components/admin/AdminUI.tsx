import type { ReactNode } from "react";
import type { BookingStatus } from "@/lib/domain/schemas";
import styles from "./AdminUI.module.css";

export function PageHead({ title, children, actions }: { title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className={styles.head}>
      <div>
        <h1 className={styles.h1}>{title}</h1>
        {children ? <p className={styles.sub}>{children}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}

export function Panel({ title, children, action, className = "" }: { title?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={`${styles.panel} ${className}`}>
      {title || action ? (
        <header className={styles.panelHead}>
          {title ? <h2 className={styles.h2}>{title}</h2> : <span />}
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

const LABEL: Record<BookingStatus, string> = { new: "New", confirmed: "Confirmed", done: "Done", declined: "Declined", cancelled: "Cancelled" };

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`${styles.badge} ${styles[`s_${status}`]}`}>{LABEL[status]}</span>;
}
