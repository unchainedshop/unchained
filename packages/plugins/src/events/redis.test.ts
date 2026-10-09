import assert from 'node:assert/strict';
import test from 'node:test';
import type { createClient } from '@redis/client';
import { RedisEventEmitter } from './redis.ts';

test('RedisEventEmitter delivers an event to every subscriber', () => {
  const redisListeners: ((payload: string) => void)[] = [];
  const createRedisClient = (() => ({
    publish: () => Promise.resolve(0),
    subscribe: (_eventName: string, listener: (payload: string) => void) => {
      redisListeners.push(listener);
      return Promise.resolve();
    },
    close: () => Promise.resolve(),
  })) as unknown as typeof createClient;
  const adapter = RedisEventEmitter(createRedisClient);
  const received: string[] = [];

  adapter.subscribe('ORDER_CHECKOUT', () => received.push('first'));
  adapter.subscribe('ORDER_CHECKOUT', () => received.push('second'));

  assert.equal(redisListeners.length, 1);
  redisListeners[0](JSON.stringify({ payload: { order: { _id: 'order-id' } } }));
  assert.deepEqual(received, ['first', 'second']);
});
