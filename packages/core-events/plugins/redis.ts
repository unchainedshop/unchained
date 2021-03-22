import redis from 'redis';
import EventDirector, { EventAdapter } from '../director';

class RedisEventEmitter extends EventAdapter {
  redisPublisher = redis.createClient({
    port: 6379, // replace with your port
    host: '127.0.0.1', // replace with your hostanme or IP address
  });

  private static subscribedEvents = new Set();

  redisSubscriber = redis.createClient({
    port: 6379, // replace with your port
    host: '127.0.0.1', // replace with your hostanme or IP address
  });

  publish(eventName, payload) {
    this.redisPublisher.publish(eventName, JSON.stringify(payload));
  }

  subscribe(eventName, callBack) {
    this.redisSubscriber.on('message', (channelName, payload) =>
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
