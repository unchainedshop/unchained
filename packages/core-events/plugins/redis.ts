import redis from 'redis';
import { EventDirector, EventAdapter } from 'meteor/unchained:core-events';
// import { EventDirector, EventAdapter } from 'unchained-core-events';

const { REDIS_PORT = 6379, REDIS_HOST = '127.0.0.1' } = process.env;

const subscribedEvents = new Set();

const RedisEventEmitter = (): EventAdapter => {
  const redisPublisher = redis.createClient({
    port: REDIS_PORT,
    host: REDIS_HOST,
  });

  const redisSubscriber = redis.createClient({
    port: REDIS_PORT,
    host: REDIS_HOST,
  });

  return {
    publish: (eventName, payload) =>
      redisPublisher.publish(eventName, JSON.stringify(payload)),
    subscribe: (eventName, callback) => {
      redisSubscriber.on('message', (_channelName, payload) =>
        callback(payload)
      );
      if (!subscribedEvents.has(eventName)) {
        redisSubscriber.subscribe(eventName);
        subscribedEvents.add(eventName);
      }
    },
  };
};

EventDirector.setEventAdapter(RedisEventEmitter());
