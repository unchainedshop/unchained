---
sidebar_position: 19
title: Redis Events
sidebar_label: Redis Events
description: Redis pub/sub event adapter
---

# Redis Events

The Redis adapter publishes JSON payloads to a channel named after each event and deserializes messages for subscribers.

## Installation

```bash
npm install @redis/client
```

Set the environment before importing the plugin:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

```typescript
import '@unchainedshop/plugins/events/redis.js';
```

The import calls `setEmitAdapter()` when the Redis settings are present. `RedisEventEmitter` is an internal factory and is not exported. Import the selected adapter before registering event subscriptions; a later event-adapter import replaces the active adapter.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_HOST` | Unset | Redis hostname; required for registration |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_DB` | `0` | Redis database number |

## Current Limitations

The implementation creates publisher and subscriber clients but does not call their `connect()` methods. Connection lifecycle handling must be added before this adapter can be used with the declared Redis client dependency.

It also subscribes only the first callback registered for each event name. Applications with multiple listeners for one event need callback fan-out. There is no retry, replay, or durable event queue in this adapter.

Event callbacks receive a payload envelope:

```typescript
import { registerEvents, subscribe } from '@unchainedshop/events';

registerEvents(['CUSTOM_EVENT']);
subscribe('CUSTOM_EVENT', ({ payload }) => {
  console.log(payload);
});
```

## Related

- [Node.js Events](./events-node.md)
- [AWS EventBridge](./events-eventbridge.md)
- [Adapter source](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/events/redis.ts)
