export interface MemoizedWithTTL<A extends unknown[], R> {
  (...args: A): Promise<R>;
  clear: () => void;
  delete: (key: unknown) => boolean;
}

interface CacheEntry<R> {
  promise: Promise<R>;
  settled: boolean;
  expires: number;
}

/**
 * Memoizes an async function with a time-to-live cache.
 *
 * The in-flight promise itself is cached, so concurrent callers share one
 * underlying invocation regardless of the TTL, and a resolved `null`/`undefined`
 * stays cached until it expires. The TTL is counted from settlement. A rejected
 * promise is evicted as soon as it settles, so the next caller retries instead
 * of receiving a cached failure.
 *
 * @param fn - The async function to memoize
 * @param options.ttl - Cache lifetime in milliseconds, counted from resolution
 * @param options.cacheKey - Maps the argument list to a cache key (defaults to the first argument)
 */
export default function memoizeWithTTL<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  { ttl, cacheKey = (args: A) => args[0] as unknown }: { ttl: number; cacheKey?: (args: A) => unknown },
): MemoizedWithTTL<A, R> {
  const cache = new Map<unknown, CacheEntry<R>>();

  const memoized = (...args: A): Promise<R> => {
    const key = cacheKey(args);
    const now = Date.now();
    const hit = cache.get(key);
    if (hit && (!hit.settled || hit.expires > now)) return hit.promise;

    // Sweep expired entries on write so caches keyed by unbounded input
    // (e.g. request headers) cannot grow indefinitely.
    for (const [expiredKey, entry] of cache) {
      if (entry.settled && entry.expires <= now) cache.delete(expiredKey);
    }

    const entry: CacheEntry<R> = { promise: fn(...args), settled: false, expires: Infinity };
    cache.set(key, entry);
    entry.promise.then(
      () => {
        entry.settled = true;
        entry.expires = Date.now() + ttl;
      },
      () => {
        // Only evict our own entry — a slow failure must not evict a newer refresh.
        if (cache.get(key) === entry) cache.delete(key);
      },
    );
    return entry.promise;
  };

  memoized.clear = () => cache.clear();
  memoized.delete = (key: unknown) => cache.delete(key);
  return memoized;
}
