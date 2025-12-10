import { createClient } from '@redis/client';
import { setEmitAdapter, type EmitAdapter } from '@unchainedshop/events';

const { REDIS_PORT = '6379', REDIS_HOST, REDIS_DB = '0' } = process.env;

const subscribedEvents = new Set();

const RedisEventEmitter = (): EmitAdapter => {
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
  };
};

if (REDIS_HOST && REDIS_PORT && REDIS_DB) {
  setEmitAdapter(RedisEventEmitter());
}
