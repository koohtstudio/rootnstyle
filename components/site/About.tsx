import { Confirm, ReviewOnly } from "@/components/ui/Confirm";
import { Photo } from "@/components/ui/Photo";
import { COPY } from "@/lib/domain/content";
import { imageMeta } from "@/lib/generated/image-meta";
import styles from "./About.module.css";

const POINTS = ["Top-quality brands and treatments", "A team that listens", "An easy, friendly chair"];

export function About({ heading = true }: { heading?: boolean }) {
  return (
    <section className={styles.section} aria-label={heading ? undefined : "About the salon"} aria-labelledby={heading ? "about-title" : undefined}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.photo}>
          <Photo
            src="/images/barber-tools.jpg"
            alt="Scissors, clippers, combs and brushes laid out neatly on a dark towel at the styling station"
            fill
            quality={70}
            sizes="(max-width: 899px) 92vw, 520px"
            blur={imageMeta["barber-tools.jpg"]?.blur}
            className={styles.img}
          />
        </div>
        <div className={styles.copy}>
          {heading ? <span className="eyebrow">About us</span> : null}
          <h2 id="about-title" className={styles.quote}>
            Beautiful hair that looks good and <em>stays healthy.</em>
          </h2>
          <p className={styles.body}>
            {COPY.aboutBody} <Confirm what="owner story and team names" />
          </p>
          <ul className={styles.points}>
            {POINTS.map((p) => (
              <li key={p}>
                <span className={styles.dot} aria-hidden="true" /> {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <ReviewOnly>
        <div className={`container ${styles.team}`}>
          <h3>Team <Confirm what="no names found, placeholders only" /></h3>
          <ul>
            {[1, 2, 3].map((n) => (
              <li key={n} className={styles.member}>
                <span className={styles.avatar} aria-hidden="true" />
                <span>Team member <Confirm text="name to confirm" /></span>
              </li>
            ))}
          </ul>
        </div>
      </ReviewOnly>
    </section>
  );
}
