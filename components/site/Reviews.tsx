"use client";

import { Confirm, Sample } from "@/components/ui/Confirm";
import { Icon } from "@/components/ui/Icon";
import { Stars } from "@/components/ui/Stars";
import { GOOGLE } from "@/lib/domain/content";
import styles from "./Reviews.module.css";

export function Reviews() {
  return (
    <section id="reviews" className={styles.section} aria-labelledby="reviews-title">
      <div className="container">
        <div className={styles.head}>
          <div>
            <span className="eyebrow">Reviews</span>
            <h2 id="reviews-title" className={styles.title}>
              What clients <em>say.</em>
            </h2>
          </div>
          <div className={styles.rating}>
            <Stars rating={GOOGLE.rating} size={22} />
            <p>
              <strong>{GOOGLE.rating}</strong> from {GOOGLE.count} reviews on Google <Confirm what="current numbers at launch" />
            </p>
            <a className="btn btn-primary btn-sm" href={GOOGLE.url} target="_blank" rel="noopener noreferrer">
              Read reviews on Google <Icon name="external" size={16} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
        <ul className={styles.cards}>
          {[1, 2, 3].map((n) => (
            <li key={n} className={styles.card}>
              <span className="tag">Placeholder</span>
              <p className={styles.line}>A real review from a client will appear here once the owner shares one with permission.</p>
              <span className={styles.bars} aria-hidden="true">
                <i />
                <i />
              </span>
              <p className={styles.who}>
                Client name <Sample what="placeholder" />
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
