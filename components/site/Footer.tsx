"use client";

import Link from "next/link";
import { Confirm } from "@/components/ui/Confirm";
import { Icon } from "@/components/ui/Icon";
import { APP_MODE } from "@/lib/config";
import { BUSINESS, INSTAGRAM_URL, MAPS_URL, NAV } from "@/lib/domain/content";
import { telHref } from "@/lib/domain/phone";
import { useSettings } from "@/lib/hooks/data";
import { Logo } from "./Logo";
import styles from "./Footer.module.css";

export function Footer() {
  const { data: settings } = useSettings();
  const c = settings?.contact;
  return (
    <footer className={`${styles.footer} on-dark`}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <Logo size={72} light />
          <p className={styles.tag}>
            We&apos;ll style, <em>you&apos;ll smile.</em>
          </p>
          <p className={styles.muted}>{BUSINESS.name}. {BUSINESS.city}.</p>
        </div>

        <nav aria-label="Footer" className={styles.col}>
          <h2 className={styles.h}>Explore</h2>
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href}>{n.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
          </ul>
        </nav>

        <div className={styles.col}>
          <h2 className={styles.h}>Find us</h2>
          <ul>
            <li>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                <Icon name="pin" size={16} /> {c?.address}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <Confirm what="unit number" />
            </li>
            {c ? (
              <>
                <li>
                  <a href={telHref(c.phone)}>
                    <Icon name="phone" size={16} /> {c.phone}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${c.email}`}>
                    <Icon name="mail" size={16} /> {c.email}
                  </a>
                </li>
              </>
            ) : null}
            <li>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                <Icon name="instagram" size={16} /> {c?.instagram || "@rootsnstyle"}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <Confirm what="handle and follower count" />
            </li>
          </ul>
        </div>

        <div className={styles.col}>
          <h2 className={styles.h}>Salon team</h2>
          <ul>
            <li>
              <Link href="/admin/login">Owner login</Link>
            </li>
            <li>
              <Link href="/about#join">Join the team</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className={`container ${styles.base}`}>
        <p>&copy; {new Date().getFullYear()} {BUSINESS.name}</p>
        {APP_MODE === "mock" ? <p className={styles.demo}>Design preview. Sample data, nothing is real.</p> : null}
      </div>
    </footer>
  );
}
