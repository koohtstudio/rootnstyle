import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className={styles.head}>
      <div className="container">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="display">{title}</h1>
        {children ? <p className={styles.intro}>{children}</p> : null}
      </div>
    </header>
  );
}
