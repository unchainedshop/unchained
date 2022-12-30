import 'abort-controller/polyfill';
import LRUCache from 'lru-cache';

class Cache {
  cache;

  constructor(ttlSeconds = 60) {
    this.cache = new LRUCache({
      max: 500,
      ttl: ttlSeconds * 1000,
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
