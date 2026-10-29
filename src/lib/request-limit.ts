const MAX_TRACKED_KEYS = 5000;

type RequestBucket = {
  count: number;
  resetAt: number;
};

export type RequestLimitResult =
  { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function requestClientKey(
  forwardedFor: string | null,
  realIp: string | null,
): string {
  const candidate = forwardedFor?.split(",")[0]?.trim() || realIp?.trim();
  return candidate || "local";
}

/**
 * In-memory fixed-window limiter. Each limiter keeps its own buckets, so
 * recipe generation, sign-in and uploads are limited independently.
 */
export function createRequestLimiter(options: {
  windowMs: number;
  maxRequests: number;
}) {
  const buckets = new Map<string, RequestBucket>();

  return function check(key: string, now = Date.now()): RequestLimitResult {
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
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return { allowed: true };
    }

    if (existing.count >= options.maxRequests) {
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
  };
}

/** Limiter for recipe generation (unchanged limits). */
export const checkRequestLimit = createRequestLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 12,
});
