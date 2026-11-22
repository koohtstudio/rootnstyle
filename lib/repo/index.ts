import { APP_MODE } from "@/lib/config";
import type { Repo } from "./types";
import { createMockRepo } from "./mock";
import { createBrowserMockRepo } from "./mock/browser";
import { memoryKV } from "./mock/store";
import { createNeonRepo } from "./neon";

let instance: Repo | undefined;

/**
 * The only door to data. Picks the adapter from NEXT_PUBLIC_APP_MODE.
 * Components never call this directly. They use the hooks in lib/hooks.
 */
export function getRepo(): Repo {
  if (instance) return instance;
  if (APP_MODE === "live") {
    instance = createNeonRepo();
  } else if (typeof window === "undefined") {
    // Server render: an in-memory copy of the seed so public pages have real content in the HTML.
    instance = createMockRepo({ storage: memoryKV(), latency: null });
  } else {
    instance = createBrowserMockRepo();
  }
  return instance;
}

export type { Repo } from "./types";
