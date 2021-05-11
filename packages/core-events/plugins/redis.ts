import redis from 'redis';
import EventDirector, { EventAdapter } from '../director';

const { REDIS_PORT = 6379, REDIS_HOST = '127.0.0.1' } = process.env;
class RedisEventEmitter extends EventAdapter {
  redisPublisher = redis.createClient({
    port: REDIS_PORT,
    host: REDIS_HOST,
  });

  private static subscribedEvents = new Set();

  redisSubscriber = redis.createClient({
    port: REDIS_PORT,
    host: REDIS_HOST,
  });

  publish(eventName, payload) {
    this.redisPublisher.publish(eventName, JSON.stringify(payload));
  }

  subscribe(eventName, callBack) {
    this.redisSubscriber.on('message', (_channelName, payload) =>
      callBack(payload)
    );
    if (!RedisEventEmitter.subscribedEvents.has(eventName)) {
      this.redisSubscriber.subscribe(eventName);
      RedisEventEmitter.subscribedEvents.add(eventName);
    }
  }
}

const handler = new RedisEventEmitter();

EventDirector.setEventAdapter(handler);
