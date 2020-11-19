import LRUCache from 'lru-cache';

class Cache {
  constructor(ttlSeconds = 60) {
    this.cache = new LRUCache({
      max: 500,
      maxAge: ttlSeconds,
    });
  }

  get(key, currentFuntion) {
    const value = this.cache.get(key);
    if (value) {
      return Promise.resolve(value);
    }
    return currentFuntion().then((result) => {
      this.cache.set(key, result);
      return result;
    });
  }

  del(keys) {
    this.cache.del(keys);
  }

  flushAll() {
    this.cache.reset();
  }
}

export default Cache;
