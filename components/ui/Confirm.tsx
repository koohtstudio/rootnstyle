"use client";

import type { ReactNode } from "react";
import { useReviewMode } from "@/lib/hooks/session";

/** Shows a [confirm] marker only in review mode (?review=1). Renders nothing for visitors. */
export function Confirm({ what, text }: { what?: string; text?: string }) {
  const review = useReviewMode();
  if (!review) return null;
  return <span className="confirm-tag">{text ? `[${text}]` : `[confirm${what ? `: ${what}` : ""}]`}</span>;
}

/** Marks content that is not from CONTENT.md. Review mode only. */
export function Sample({ what }: { what?: string }) {
  const review = useReviewMode();
  if (!review) return null;
  return <span className="confirm-tag">{`[sample${what ? `: ${what}` : ""}]`}</span>;
}

/** Renders its children only in review mode. */
export function ReviewOnly({ children }: { children: ReactNode }) {
  const review = useReviewMode();
  return review ? <>{children}</> : null;
}
