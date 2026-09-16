/**
 * Redis Event Emitter Adapter
 *
 * NOTE: This file uses a different pattern than the plugin architecture.
 * Events adapters implement the EmitAdapter interface and are registered
 * explicitly via setEmitAdapter() instead of the standard IPlugin pattern:
 *
 *   import { setEmitAdapter } from '@unchainedshop/events';
 *   import { RedisEventEmitter } from '@unchainedshop/plugins/events/redis';
 *   setEmitAdapter(RedisEventEmitter());
 */
import { createClient } from '@redis/client';
import type { EmitAdapter } from '@unchainedshop/events';

const { REDIS_PORT = '6379', REDIS_HOST, REDIS_DB = '0' } = process.env;

export const RedisEventEmitter = (createRedisClient = createClient): EmitAdapter => {
  const subscribers = new Map<string, Set<Parameters<EmitAdapter['subscribe']>[1]>>();
  const redisPublisher = createRedisClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
    database: parseInt(REDIS_DB, 10),
  });

  const redisSubscriber = createRedisClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
    database: parseInt(REDIS_DB, 10),
  });

  return {
    publish: (eventName, payload) => redisPublisher.publish(eventName, JSON.stringify(payload)),
    subscribe: (eventName, callback) => {
      let callbacks = subscribers.get(eventName);
      if (!callbacks) {
        callbacks = new Set();
        subscribers.set(eventName, callbacks);
        const eventCallbacks = callbacks;
        redisSubscriber.subscribe(eventName, (payload) => {
          const parsedPayload = JSON.parse(payload);
          eventCallbacks.forEach((eventCallback) => eventCallback(parsedPayload));
        });
      }
      callbacks.add(callback);
    },
    shutdown: async () => {
      await Promise.allSettled([redisPublisher.close(), redisSubscriber.close()]);
    },
  };
};

export default RedisEventEmitter;
