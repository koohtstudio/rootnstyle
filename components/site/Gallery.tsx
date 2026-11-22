"use client";

import { useState } from "react";
import { Photo } from "@/components/ui/Photo";
import { Confirm, Sample } from "@/components/ui/Confirm";
import { EmptyState } from "@/components/ui/States";
import { galleryTags, type GalleryTag } from "@/lib/domain/schemas";
import { usePublicGallery } from "@/lib/hooks/data";
import { Lightbox } from "./Lightbox";
import styles from "./Gallery.module.css";

type Filter = "all" | GalleryTag;
const LABEL: Record<Filter, string> = { all: "All", colour: "Colour", styling: "Styling", cuts: "Cuts" };

export function Gallery({ heading = true }: { heading?: boolean }) {
  const { data: photos = [] } = usePublicGallery();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<number | null>(null);

  const shown = filter === "all" ? photos : photos.filter((p) => p.tag === filter);
  const count = (f: Filter) => (f === "all" ? photos.length : photos.filter((p) => p.tag === f).length);

  return (
    <section className={styles.section} aria-label={heading ? undefined : "Our work"} aria-labelledby={heading ? "work-title" : undefined}>
      <div className="container">
        {heading ? (
          <div className={styles.head}>
            <span className="eyebrow">Our work</span>
            <h2 id="work-title" className={styles.title}>
              Real results, <em>real clients.</em>
            </h2>
          </div>
        ) : null}
        <p className={styles.note}>
          Photos are shared with each client&apos;s agreement.
          <Confirm what="client consent for every photo" />
          <Sample what="titles and filter tags" />
        </p>

        <div className="chip-row" role="group" aria-label="Filter photos">
          {(["all", ...galleryTags] as Filter[]).map((f) => (
            <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {LABEL[f]} <span className={styles.count}>{count(f)}</span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <EmptyState icon="image" title="No photos in this group yet" action={filter !== "all" ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFilter("all")}>Show all photos</button> : undefined}>
            Check back soon, we add new work often.
          </EmptyState>
        ) : (
          <ul className={styles.grid} aria-live="polite">
            {shown.map((p, i) => (
              <li key={p.id}>
                <button type="button" className={styles.tile} onClick={() => setOpen(i)}>
                  <span className="sr-only">Open photo: </span>
                  {/* The caption names the photo, so the thumbnail is decorative here. The full description shows in the viewer. */}
                  <Photo src={p.src} alt="" blur={p.blur} fill sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 280px" quality={70} className={styles.img} />
                  <span className={styles.cap}>
                    <span>{p.title}</span>
                    <span className={styles.tagLabel}>{LABEL[p.tag]}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Lightbox photos={shown} index={open} onIndex={setOpen} />
    </section>
  );
}
