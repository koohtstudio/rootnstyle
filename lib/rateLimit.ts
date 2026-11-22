// STUB rate limiter: a fixed window in memory, per server instance.
// Good enough to prove the wiring and stop a single noisy client. Live mode should swap this
// for a shared store (Upstash Redis, or a Neon table) so the limit holds across instances.
const WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = Number(process.env.RATE_LIMIT_PER_MIN ?? 12), now = Date.now()) {
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true as const, remaining: limit - 1, retryAfterSec: 0 };
  }
  entry.count += 1;
  if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  if (entry.count > limit) return { ok: false as const, remaining: 0, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  return { ok: true as const, remaining: limit - entry.count, retryAfterSec: 0 };
}

export function resetRateLimit() {
  hits.clear();
}
