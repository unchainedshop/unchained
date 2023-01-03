import redis from 'redis';
import { EmitAdapter } from '@unchainedshop/types/events.js';
import { setEmitAdapter } from '@unchainedshop/events';

const { REDIS_PORT = 6379, REDIS_HOST = '127.0.0.1' } = process.env;

const subscribedEvents = new Set();

const RedisEventEmitter = (): EmitAdapter => {
  const redisPublisher = redis.createClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
  });

  const redisSubscriber = redis.createClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
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

setEmitAdapter(RedisEventEmitter());
