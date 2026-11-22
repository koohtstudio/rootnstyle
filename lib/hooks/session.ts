"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { Session } from "@/lib/domain/schemas";
import { getRepo } from "@/lib/repo";

/** undefined while the browser has not been checked yet, null when signed out. */
export function useSession(): Session | null | undefined {
  const auth = getRepo().auth;
  return useSyncExternalStore(
    auth.subscribe,
    auth.getSession,
    () => undefined,
  );
}

// ----- per tab flags (banner dismissed, review mode) -----

const FLAG_EVENT = "rns-flag";

function readFlag(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string, on: boolean) {
  try {
    if (on) window.sessionStorage.setItem(key, "1");
    else window.sessionStorage.removeItem(key);
  } catch {
    // storage blocked: the flag simply does not stick
  }
  window.dispatchEvent(new Event(FLAG_EVENT));
}

const subscribeFlag = (cb: () => void) => {
  window.addEventListener(FLAG_EVENT, cb);
  return () => window.removeEventListener(FLAG_EVENT, cb);
};

/** A boolean that lasts for this browser tab only. false on the server. */
export function useSessionFlag(key: string): [boolean, (on: boolean) => void] {
  const value = useSyncExternalStore(subscribeFlag, () => readFlag(key), () => false);
  const set = useCallback((on: boolean) => writeFlag(key, on), [key]);
  return [value, set];
}

const REVIEW_KEY = "rns-review";

/**
 * Review mode shows [confirm] markers for unverified facts. Turn it on with ?review=1.
 * It stays on for the tab until ?review=0.
 */
export function useReviewMode(): boolean {
  const params = useSearchParams();
  const param = params.get("review");
  const [on, set] = useSessionFlag(REVIEW_KEY);
  useEffect(() => {
    if (param === "1" && !readFlag(REVIEW_KEY)) set(true);
    if (param === "0" && readFlag(REVIEW_KEY)) set(false);
  }, [param, set]);
  return on || param === "1" ? param !== "0" : false;
}
