import styles from "./Switch.module.css";

export function Switch({ checked, onChange, label, disabled, id }: { checked: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={styles.switch}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.track}><span className={styles.thumb} /></span>
    </button>
  );
}
