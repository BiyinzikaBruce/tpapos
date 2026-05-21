import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const PREFIX = "tpapos:";

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 300
): Promise<T> {
  const prefixed = `${PREFIX}${key}`;
  const cached = await redis.get<T>(prefixed);
  if (cached !== null) return cached;
  const data = await fetcher();
  await redis.setex(prefixed, ttl, data);
  return data;
}

export async function invalidateTag(tag: string): Promise<void> {
  const keys = await redis.keys(`${PREFIX}${tag}:*`);
  if (keys.length > 0) await redis.del(...keys);
}
