import redis from 'redis';
import EventDirector, { EventAdapter } from '../director';

class RedisEventEmitter extends EventAdapter {
  redisPublisher = redis.createClient({
    port: 6379, // replace with your port
    host: '127.0.0.1', // replace with your hostanme or IP address
  });

  redisSubscriber = redis.createClient({
    port: 6379, // replace with your port
    host: '127.0.0.1', // replace with your hostanme or IP address
  });

  publish(eventName, payload) {
    this.redisPublisher.publish(eventName, JSON.stringify(payload));
  }

  subscribe(eventName, callBack) {
    this.redisSubscriber.on('message', callBack);
    this.redisSubscriber.subscribe(eventName);
  }
}

const handler = new RedisEventEmitter();

EventDirector.setEventAdapter(handler);
