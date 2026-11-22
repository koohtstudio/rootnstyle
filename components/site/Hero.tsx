import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { imageMeta } from "@/lib/generated/image-meta";
import { COPY } from "@/lib/domain/content";
import { GoogleBadge } from "./GoogleBadge";
import { NextOpenChip } from "./NextOpenChip";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <span className="eyebrow">Hair salon and spa in Brampton</span>
          <h1 id="hero-title" className={`display ${styles.title}`}>
            We&apos;ll style, <em>you&apos;ll smile.</em>
          </h1>
          <p className={styles.sub}>{COPY.heroSub}</p>
          <div className={styles.actions}>
            <Link href="/book" className="btn btn-primary">
              Book online
            </Link>
            <Link href="/services" className="btn btn-ghost">
              See services
            </Link>
          </div>
          <GoogleBadge />
        </div>
        <div className={styles.art}>
          <span className={styles.blob} aria-hidden="true" />
          <div className={styles.arch}>
            <Photo
              src="/images/hero-long-hair.jpg"
              alt="A woman with smooth, long brown hair holds the ends in one hand and looks toward the camera"
              fill
              priority
              quality={70}
              sizes="(max-width: 899px) 86vw, 520px"
              blur={imageMeta["hero-long-hair.jpg"]?.blur}
              className={styles.img}
            />
          </div>
          <NextOpenChip />
        </div>
      </div>
    </section>
  );
}
