import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
});

// Redis here is purely a cache — a misconfigured token, an outage, or any
// other Redis failure should degrade to "compute fresh from the database"
// rather than break the caller. Use these instead of calling redis.get/set
// directly wherever the result is optional/cacheable.
export async function safeCacheGet<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key);
  } catch {
    return null;
  }
}

export async function safeCacheSet(
  key: string,
  value: unknown,
  opts: { ex: number }
): Promise<void> {
  try {
    await redis.set(key, value, opts);
  } catch {
    // ignore — caching is best-effort
  }
}
