"use client";

import { Confirm } from "@/components/ui/Confirm";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { COPY, MAPS_URL } from "@/lib/domain/content";
import { telHref } from "@/lib/domain/phone";
import { dayOfWeek, formatTime12, salonNow, weekdayName } from "@/lib/domain/time";
import { imageMeta } from "@/lib/generated/image-meta";
import { useHours, useSettings } from "@/lib/hooks/data";
import styles from "./Visit.module.css";

const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function Visit({ heading = true }: { heading?: boolean }) {
  const { data: hours = [] } = useHours();
  const { data: settings } = useSettings();
  const today = dayOfWeek(salonNow().dateKey);
  const c = settings?.contact;

  return (
    <section id="visit" className={styles.section} aria-label={heading ? undefined : "Visit"} aria-labelledby={heading ? "visit-title" : undefined}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.info}>
          {heading ? <span className="eyebrow">Visit</span> : null}
          <h2 id="visit-title" className={styles.title}>
            Drop in, or <em>book a time.</em>
          </h2>
          <p className={styles.sub}>{COPY.specials}</p>

          <div className={styles.cols}>
            <div>
              <h3 className={styles.h}>
                Hours <Confirm text="confirm, hours differ slightly between sources" />
              </h3>
              <table className={styles.hours}>
                <caption className="sr-only">Opening hours</caption>
                <tbody>
                  {ORDER.map((d) => {
                    const h = hours.find((x) => x.day === d);
                    return (
                      <tr key={d} className={d === today ? styles.today : undefined} suppressHydrationWarning>
                        <th scope="row">
                          {weekdayName(d)}
                          {d === today ? <span className={styles.now} suppressHydrationWarning>Today</span> : null}
                        </th>
                        <td>{!h || h.closed ? "Closed" : `${formatTime12(h.open)} to ${formatTime12(h.close)}`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div>
              <h3 className={styles.h}>Find us</h3>
              <ul className={styles.contact}>
                <li>
                  <Icon name="pin" size={18} />
                  <span>
                    {c?.address} <Confirm what="unit number" />
                  </span>
                </li>
                {c ? (
                  <>
                    <li>
                      <Icon name="phone" size={18} />
                      <a href={telHref(c.phone)}>{c.phone}</a>
                    </li>
                    <li>
                      <Icon name="mail" size={18} />
                      <a href={`mailto:${c.email}`}>{c.email}</a>
                    </li>
                  </>
                ) : null}
              </ul>
              <div className={styles.actions}>
                <a className="btn btn-primary" href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                  Get directions <Icon name="external" size={16} />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                {c ? (
                  <a className="btn btn-ghost" href={telHref(c.phone)}>
                    Call us
                  </a>
                ) : null}
              </div>
              <p className={styles.map}>
                Map pin <Confirm what="map pin" />
              </p>
            </div>
          </div>
        </div>
        <div className={styles.photo}>
          <Photo
            src="/images/salon-hours.jpg"
            alt="A model with long, glossy waves in front of a dark backdrop, wearing gold hoop earrings"
            fill
            quality={70}
            sizes="(max-width: 899px) 92vw, 480px"
            blur={imageMeta["salon-hours.jpg"]?.blur}
            className={styles.img}
          />
        </div>
      </div>
    </section>
  );
}
