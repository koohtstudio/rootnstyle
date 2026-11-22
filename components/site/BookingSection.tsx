import { COPY } from "@/lib/domain/content";
import { BookingWidget } from "./BookingWidget";
import styles from "./BookingSection.module.css";

/** The dark Book online band on the home page. */
export function BookingSection({ initialServiceId }: { initialServiceId?: string | null }) {
  return (
    <section id="book" className={`${styles.section} on-dark`} aria-labelledby="book-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <span className="eyebrow">Book online</span>
          <h2 id="book-title" className={styles.title}>
            Your chair is <em>waiting.</em>
          </h2>
          <p className={styles.lead}>{COPY.bookingIntro}</p>
          <ol className={styles.steps}>
            <li><span>1</span> Choose a service</li>
            <li><span>2</span> Pick a day and time</li>
            <li><span>3</span> We confirm by text or email</li>
          </ol>
        </div>
        <BookingWidget key={initialServiceId ?? "none"} initialServiceId={initialServiceId} variant="section" />
      </div>
    </section>
  );
}
