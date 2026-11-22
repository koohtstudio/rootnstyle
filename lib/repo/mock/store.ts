import { mockStateSchema, type MockState } from "@/lib/domain/schemas";
import { salonNow, type SalonNow } from "@/lib/domain/time";
import { buildSeed } from "@/lib/mock/seed";

export const STORE_KEY = "rns-mock-v1";
export const SESSION_KEY = "rns-session-v1";
export const CHANNEL_NAME = "rns-mock";

export interface KV {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ChannelLike {
  postMessage(msg: unknown): void;
  onmessage: ((ev: { data: unknown }) => void) | null;
  close(): void;
}

export interface StoreDeps {
  storage: KV;
  channel?: ChannelLike | null;
  now?: () => SalonNow;
}

export function memoryKV(): KV {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

/** Shared in-memory bus so tests can simulate two tabs. */
export function memoryBus() {
  const channels = new Set<ChannelLike>();
  return {
    create(): ChannelLike {
      const ch: ChannelLike = {
        onmessage: null,
        postMessage(msg) {
          for (const other of channels) {
            if (other !== ch) queueMicrotask(() => other.onmessage?.({ data: msg }));
          }
        },
        close() {
          channels.delete(ch);
        },
      };
      channels.add(ch);
      return ch;
    },
  };
}

/**
 * The fake database. One JSON document in localStorage, re-read before every write so two
 * tabs never overwrite each other with stale data, and a BroadcastChannel ping after every write.
 */
export class MockStore {
  private deps: StoreDeps;
  private cache: MockState;
  private lastRaw: string | null = null;
  private listeners = new Set<() => void>();

  constructor(deps: StoreDeps) {
    this.deps = deps;
    this.cache = this.load();
    if (deps.channel) {
      deps.channel.onmessage = () => this.refreshFromExternal();
    }
  }

  private now(): SalonNow {
    return this.deps.now ? this.deps.now() : salonNow();
  }

  private load(): MockState {
    let raw: string | null = null;
    try {
      raw = this.deps.storage.getItem(STORE_KEY);
    } catch {
      raw = null;
    }
    if (raw) {
      try {
        const parsed = mockStateSchema.safeParse(JSON.parse(raw));
        if (parsed.success) {
          this.lastRaw = raw;
          return parsed.data;
        }
      } catch {
        // fall through to reseed
      }
    }
    const fresh = buildSeed(this.now());
    this.write(fresh);
    return fresh;
  }

  private write(state: MockState): void {
    const raw = JSON.stringify(state);
    try {
      this.deps.storage.setItem(STORE_KEY, raw);
      this.lastRaw = raw;
    } catch {
      throw new Error("QUOTA");
    }
  }

  /** Call from the browser `storage` event and from channel messages. */
  refreshFromExternal(): void {
    this.read();
    this.emit();
  }

  /** Current state. Cheap: only re-parses when another tab changed the stored text. */
  read(): MockState {
    let raw: string | null = null;
    try {
      raw = this.deps.storage.getItem(STORE_KEY);
    } catch {
      raw = this.lastRaw;
    }
    if (raw !== this.lastRaw) this.cache = this.load();
    return this.cache;
  }

  /** Apply a change atomically against the freshest data, then tell everyone. */
  mutate<T>(fn: (draft: MockState) => T): T {
    const draft: MockState = structuredClone(this.read());
    const result = fn(draft);
    draft.rev += 1;
    this.write(draft);
    this.cache = draft;
    this.deps.channel?.postMessage({ type: "changed", rev: draft.rev });
    this.emit();
    return result;
  }

  reset(): void {
    const prevRev = this.read().rev;
    const fresh = buildSeed(this.now());
    fresh.rev = prevRev + 1;
    this.write(fresh);
    this.cache = fresh;
    this.deps.channel?.postMessage({ type: "changed", rev: fresh.rev });
    this.emit();
  }

  subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(): void {
    for (const cb of [...this.listeners]) cb();
  }
}
