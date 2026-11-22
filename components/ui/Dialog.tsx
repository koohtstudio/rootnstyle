"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";
import styles from "./Dialog.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** sheet slides up from the bottom on phones. */
  variant?: "modal" | "sheet";
  wide?: boolean;
  footer?: ReactNode;
  /** Hides the visible title but keeps it for screen readers. */
  hideTitle?: boolean;
}

/** Native <dialog>: focus is trapped, Escape closes, focus returns to the opener. */
export function Dialog({ open, onClose, title, children, variant = "modal", wide, footer, hideTitle }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${variant === "sheet" ? styles.sheet : ""} ${wide ? styles.wide : ""}`}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open ? (
        <div className={styles.inner}>
          <header className={styles.head}>
            <h2 id={titleId} className={hideTitle ? "sr-only" : styles.title}>{title}</h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          </header>
          <div className={styles.body}>{children}</div>
          {footer ? <footer className={styles.foot}>{footer}</footer> : null}
        </div>
      ) : null}
    </dialog>
  );
}
