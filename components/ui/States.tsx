import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import styles from "./States.module.css";

export function EmptyState({ icon = "sparkle", title, children, action }: { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className={styles.box}>
      <span className={styles.badge}><Icon name={icon} size={24} /></span>
      <p className={styles.title}>{title}</p>
      {children ? <p className={styles.body}>{children}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = "We could not load this", children, onRetry }: { title?: string; children?: ReactNode; onRetry?: () => void }) {
  return (
    <div className={`${styles.box} ${styles.error}`} role="alert">
      <span className={styles.badge}><Icon name="alert" size={24} /></span>
      <p className={styles.title}>{title}</p>
      <p className={styles.body}>{children ?? "Please check your connection and try again."}</p>
      {onRetry ? (
        <div className={styles.action}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
            <Icon name="refresh" size={16} /> Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function Skeleton({ h = 16, w = "100%", r = 10, className = "" }: { h?: number | string; w?: number | string; r?: number; className?: string }) {
  return <span className={`${styles.skel} ${className}`} style={{ height: h, width: w, borderRadius: r }} aria-hidden="true" />;
}

export function LoadingBlock({ label = "Loading", rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} h={56} r={16} />
      ))}
    </div>
  );
}
