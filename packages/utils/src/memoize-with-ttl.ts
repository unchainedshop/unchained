type AsyncFunction = (...args: any[]) => Promise<any>;

interface MemoizeOptions {
  cacheKey?: (args: any[]) => string;
}

function createTTLCache<T>(ttlMs: number) {
  const store = new Map<string, { value: T; expiry: number }>();

  return {
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (Date.now() > entry.expiry) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key: string, value: T) {
      store.set(key, { value, expiry: Date.now() + ttlMs });
    },
    clear() {
      store.clear();
    },
  };
}

export function memoizeWithTTL<T extends AsyncFunction>(
  fn: T,
  ttlMs: number,
  options?: MemoizeOptions,
): T & { clear: () => void } {
  const cache = createTTLCache<Awaited<ReturnType<T>>>(ttlMs);

  const memoized = async function (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
    const key = options?.cacheKey ? options.cacheKey(args) : JSON.stringify(args);
    const cached = cache.get(key);
    if (cached !== undefined) return cached;

    const result = await fn(...args);
    cache.set(key, result);
    return result;
  } as T & { clear: () => void };

  memoized.clear = () => cache.clear();

  return memoized;
}
