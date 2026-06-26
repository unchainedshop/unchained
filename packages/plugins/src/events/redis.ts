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

const subscribedEvents = new Set();

export const RedisEventEmitter = (): EmitAdapter => {
  const redisPublisher = createClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
    database: parseInt(REDIS_DB, 10),
  });

  const redisSubscriber = createClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
    database: parseInt(REDIS_DB, 10),
  });

  return {
    publish: (eventName, payload) => redisPublisher.publish(eventName, JSON.stringify(payload)),
    subscribe: (eventName, callback) => {
      if (!subscribedEvents.has(eventName)) {
        redisSubscriber.subscribe(eventName, (payload) => {
          callback(JSON.parse(payload));
        });
        subscribedEvents.add(eventName);
      }
    },
    shutdown: async () => {
      await Promise.allSettled([redisPublisher.close(), redisSubscriber.close()]);
    },
  };
};

export default RedisEventEmitter;
