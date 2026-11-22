"use client";

import { Confirm } from "@/components/ui/Confirm";
import { useReviewMode } from "@/lib/hooks/session";

export const formatPrice = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

/** "From $80", "Price on request", or the review marker when the owner has not set a price. */
export function PriceLabel({ price }: { price: number | null }) {
  const review = useReviewMode();
  if (price !== null) return <>From {formatPrice(price)}</>;
  if (review) {
    return (
      <>
        From $[price] <Confirm text="price to confirm" />
      </>
    );
  }
  return <>Price on request</>;
}

export function DurationLabel({ min }: { min: number | null }) {
  const review = useReviewMode();
  if (min !== null) return <>{min >= 60 && min % 60 === 0 ? `${min / 60} hr` : `${min} min`}</>;
  return review ? <span className="confirm-tag">[time]</span> : null;
}
