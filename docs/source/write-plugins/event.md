---
title: "Event Bus"
description: Wire Unchained to an Event based system 
---

We can easily swap the default event tracker module (EventEmitter) used by unchained with out own module by implementing `EventAdapter` interface and registering it on `EventDirector` on system boot time. Both classes are exported from the `core-events` module.

Here is an example of redis-enabled Unchained Events:

```typescript
import redis from 'redis';
import EventDirector, { EventAdapter } from '@unchainedshop/core-events';

const { REDIS_PORT = 6379, REDIS_HOST = '127.0.0.1' } = process.env;

class RedisEventEmitter extends EventAdapter {
  redisPublisher = redis.createClient({
    port: REDIS_PORT,
    host: REDIS_HOST,
  });

  redisSubscriber = redis.createClient({
    port: REDIS_PORT,
    host: REDIS_HOST,
  });

  publish(eventName, payload) {
    this.redisPublisher.publish(eventName, JSON.stringify(payload));
  }

  subscribe(eventName, callback) {
    this.redisSubscriber.on('message', (_channelName, payload) =>
      callback(payload)
    );
      this.redisSubscriber.subscribe(eventName);
    }
  }
}

const handler = new RedisEventEmitter();

EventDirector.setEventAdapter(handler);


  startPlatform({...});
  ...
  registerEvents([
      'CUSTOM_EVENT_ONE',
      'CUSTOM_EVENT_TWO',
      'CUSTOM_EVENT_THREE',
  ])


```

Explanation:

We have decided to use `redis` for event tracking. In order to do that we have to create new class extending the `EventAddapter` interface and implement the two functions required `subscribe` & `publish`.

in this functions we defined how redis implements the pub/sub model.

Next all we need to is register it in `EventDirector` class using the static function `setEventAdapter`.
