// Tiny in-memory rate limiter — per-IP sliding window.
// Sized for the actual load: one instance, no horizontal scaling, hot
// path is a small Map lookup. If we ever shard, swap this for Redis/KV.

type Bucket = { count: number; windowStart: number };

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const buckets = new Map<string, Bucket>();

export type LimitVerdict =
  | { allowed: true; remaining: number; reset: number }
  | { allowed: false; reset: number };

export function take(ip: string, max: number): LimitVerdict {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now - b.windowStart > WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: max - 1, reset: now + WINDOW_MS };
  }
  if (b.count >= max) {
    return { allowed: false, reset: b.windowStart + WINDOW_MS };
  }
  b.count += 1;
  return { allowed: true, remaining: max - b.count, reset: b.windowStart + WINDOW_MS };
}

// Periodic sweep keeps the Map from growing forever in long-running
// processes. Cheap — runs every 15 min.
const sweepInterval = setInterval(
  () => {
    const now = Date.now();
    for (const [ip, b] of buckets) {
      if (now - b.windowStart > WINDOW_MS) buckets.delete(ip);
    }
  },
  15 * 60 * 1000,
);
// Don't keep the process alive solely for the sweep.
sweepInterval.unref?.();
