const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 12;
const MAX_TRACKED_KEYS = 5000;

type RequestBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RequestBucket>();

export type RequestLimitResult =
  { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function requestClientKey(
  forwardedFor: string | null,
  realIp: string | null,
): string {
  const candidate = forwardedFor?.split(",")[0]?.trim() || realIp?.trim();
  return candidate || "local";
}

export function checkRequestLimit(
  key: string,
  now = Date.now(),
): RequestLimitResult {
  if (buckets.size >= MAX_TRACKED_KEYS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }

    if (buckets.size >= MAX_TRACKED_KEYS) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey) buckets.delete(oldestKey);
    }
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000),
      ),
    };
  }

  existing.count += 1;
  return { allowed: true };
}
