"use client";

import Link from "next/link";
import { useState } from "react";
import { imageMeta } from "@/lib/generated/image-meta";
import { Photo } from "@/components/ui/Photo";
import styles from "./Logo.module.css";

/** The Instagram logo (burgundy script on peach). If the image ever fails, a text wordmark takes over. */
export function Logo({ size = 52, light = false }: { size?: number; light?: boolean }) {
  const [failed, setFailed] = useState(false);
  const meta = imageMeta["logo-ig.png"];
  return (
    <Link href="/" className={`${styles.logo} ${light ? styles.light : ""}`} aria-label="Roots n Style, home">
      {failed ? (
        <span className={styles.wordmark}>
          Roots <em>n</em> Style
        </span>
      ) : (
        <Photo
          src="/images/logo-ig.png"
          alt="Roots n Style"
          width={size}
          height={size}
          sizes={`${size}px`}
          blur={meta?.blur}
          className={styles.mark}
          onError={() => setFailed(true)}
        />
      )}
    </Link>
  );
}
