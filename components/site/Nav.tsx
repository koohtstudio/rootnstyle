"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { NAV } from "@/lib/domain/content";
import { telHref } from "@/lib/domain/phone";
import { useSettings } from "@/lib/hooks/data";
import { Logo } from "./Logo";
import styles from "./Nav.module.css";

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { data: settings } = useSettings();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));

  return (
    <header className={styles.header}>
      <nav className={`container ${styles.nav}`} aria-label="Main">
        <Logo />
        <ul className={styles.links}>
          {NAV.filter((n) => n.href !== "/book").map((n) => (
            <li key={n.href}>
              <Link href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={styles.link}>
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className={styles.cta}>
          <Link href="/book" className="btn btn-primary" aria-current={isActive("/book") ? "page" : undefined}>
            Book online
          </Link>
          <button
            type="button"
            className={styles.burger}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? "close" : "menu"} size={24} />
          </button>
        </div>
      </nav>
      {open ? (
        <div id="mobile-menu" className={styles.menu}>
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} aria-current={isActive(n.href) ? "page" : undefined}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          {settings ? (
            <a className="btn btn-ghost" href={telHref(settings.contact.phone)}>
              <Icon name="phone" size={18} /> Call {settings.contact.phone}
            </a>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
