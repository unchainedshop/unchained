---
sidebar_position: 4
sidebar_label: Event
title: Event Bus
---
:::info
Wire Unchained to an Event based system
:::


We can easily swap the default event tracker module (EventEmitter) used by unchained with out own module by implementing `EventAdapter` interface and registering it on `EventDirector` on system boot time. Both classes are exported from the `core-events` module.

Here is an example of redis-enabled Unchained Events:

```typescript
import { createClient } from '@redis/client';
import { EmitAdapter, setEmitAdapter } from '@unchainedshop/events';

const { REDIS_PORT = 6379, REDIS_HOST = '127.0.0.1' } = process.env;

const subscribedEvents = new Set();

const RedisEventEmitter = (): EmitAdapter => {
  const redisPublisher = createClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
  });

  const redisSubscriber = createClient({
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
```

Register custom events:
```typescript
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