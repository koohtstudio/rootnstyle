"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import type { GalleryPhoto } from "@/lib/domain/schemas";
import styles from "./Lightbox.module.css";

interface Props {
  photos: GalleryPhoto[];
  index: number | null;
  onIndex: (i: number | null) => void;
}

/**
 * Native <dialog>: focus stays inside, Escape closes, focus goes back to the photo that opened it.
 * Arrow keys move between photos. On phones it is a bottom sheet.
 */
export function Lightbox({ photos, index, onIndex }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const isOpen = index !== null && photos.length > 0;
  const i = isOpen ? Math.min(Math.max(index, 0), photos.length - 1) : 0;
  const photo = photos[i];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isOpen && !el.open) el.showModal();
    if (!isOpen && el.open) el.close();
  }, [isOpen]);

  const go = (d: number) => onIndex((i + d + photos.length) % photos.length);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-label="Photo viewer"
      onClose={() => onIndex(null)}
      onClick={(e) => e.target === ref.current && onIndex(null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(-1);
        }
      }}
    >
      {isOpen && photo ? (
        <figure className={styles.fig}>
          <div className={styles.stage}>
            <Photo key={photo.id} src={photo.src} alt={photo.alt} blur={photo.blur} fill sizes="(max-width: 640px) 100vw, 560px" quality={75} className={styles.img} />
          </div>
          <figcaption className={styles.caption}>
            <div>
              <strong className={styles.title}>{photo.title}</strong>
              <span className={styles.count} aria-live="polite">
                Photo {i + 1} of {photos.length}
              </span>
            </div>
            <div className={styles.controls}>
              <button type="button" className={styles.btn} onClick={() => go(-1)} aria-label="Previous photo" disabled={photos.length < 2}>
                <Icon name="left" />
              </button>
              <button type="button" className={styles.btn} onClick={() => go(1)} aria-label="Next photo" disabled={photos.length < 2}>
                <Icon name="right" />
              </button>
              <button type="button" className={`${styles.btn} ${styles.close}`} onClick={() => onIndex(null)} aria-label="Close photo viewer">
                <Icon name="close" />
              </button>
            </div>
          </figcaption>
        </figure>
      ) : null}
    </dialog>
  );
}
