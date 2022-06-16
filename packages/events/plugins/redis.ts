import redis from 'redis';
import { EmitAdapter } from '@unchainedshop/types/events';
import { setEmitAdapter } from 'meteor/unchained:events';

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
      redisSubscriber.on('message', (_channelName, payload) => callback(payload));
      if (!subscribedEvents.has(eventName)) {
        redisSubscriber.subscribe(eventName);
        subscribedEvents.add(eventName);
      }
    },
  };
};

setEmitAdapter(RedisEventEmitter());
