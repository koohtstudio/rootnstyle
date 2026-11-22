import styles from "./Stars.module.css";

export function Stars({ rating, size = 18 }: { rating: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  const row = (
    <svg viewBox="0 0 120 24" width={size * 5} height={size} aria-hidden="true" focusable="false">
      {[0, 1, 2, 3, 4].map((i) => (
        <polygon key={i} transform={`translate(${i * 24} 0)`} points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3" />
      ))}
    </svg>
  );
  return (
    <span className={styles.stars} role="img" aria-label={`${rating} out of 5 stars`}>
      <span className={styles.base}>{row}</span>
      <span className={styles.fill} style={{ width: `${pct}%` }}>
        {row}
      </span>
    </span>
  );
}
