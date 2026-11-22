"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import styles from "./Toast.module.css";

type Tone = "ok" | "error" | "info";
interface Item { id: number; message: string; tone: Tone }
interface Api { show: (message: string, tone?: Tone) => void }

const Ctx = createContext<Api>({ show: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const next = useRef(1);
  const show = useCallback((message: string, tone: Tone = "ok") => {
    const id = next.current++;
    setItems((l) => [...l.slice(-3), { id, message, tone }]);
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), tone === "error" ? 7000 : 4500);
  }, []);
  const api = useMemo(() => ({ show }), [show]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.tone]}`}>
            <Icon name={t.tone === "error" ? "alert" : t.tone === "info" ? "info" : "check"} size={18} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
