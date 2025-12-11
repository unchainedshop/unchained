---
sidebar_position: 19
title: Redis Events
sidebar_label: Redis Events
description: Distributed event system using Redis pub/sub
---

# Redis Events

Distributed event system using Redis pub/sub for cross-process communication.

## Installation

```typescript
import '@unchainedshop/plugins/events/redis';
```

:::warning Explicit Configuration Required
Unlike the Node.js event emitter (which is the default), this plugin requires explicit configuration. You must call `setEmitAdapter()` to activate Redis as your event system:

```typescript
import { setEmitAdapter } from '@unchainedshop/events';
import { RedisEventEmitter } from '@unchainedshop/plugins/events/redis';

setEmitAdapter(RedisEventEmitter());
```
:::

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_HOST` | - | Redis server hostname (required) |
| `REDIS_PORT` | `6379` | Redis server port |
| `REDIS_DB` | `0` | Redis database number |

## Features

- **Distributed**: Events work across multiple application instances
- **Persistent Connections**: Maintains Redis pub/sub connections
- **JSON Serialization**: Automatic payload serialization/deserialization
- **Scalable**: Supports horizontal scaling
- **Reliable**: Redis provides reliability and persistence options

## Use Cases

- **Multi-Instance Deployments**: Applications running on multiple servers
- **Microservices**: Communication between different services
- **Horizontal Scaling**: When you need to scale beyond a single instance
- **Production Deployments**: Robust event handling for production

## Redis Setup

### Docker

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:alpine
```

### Docker Compose

```yaml
version: '3'
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

## Configuration

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

## Usage

### Publishing Events

```typescript
import { emit } from '@unchainedshop/events';

// Events are automatically distributed to all instances
await emit('ORDER_CREATE', {
  orderId: '12345',
  userId: 'user123',
  total: 99.99
});
```

### Subscribing to Events

```typescript
import { subscribe } from '@unchainedshop/events';

// Each instance receives the event
subscribe('ORDER_CREATE', async (payload) => {
  const { orderId, userId, total } = payload;
  await processOrder(orderId);
});
```

## Performance

- **Pros**: Distributed, reliable, cost-effective
- **Cons**: Network latency, requires Redis infrastructure

## When to Use

Use Redis Events for:

- Horizontal scaling requirements
- Multiple application instances
- Production deployments
- Cost-effective distributed events

## Adapter Details

| Property | Value |
|----------|-------|
| Source | [events/redis.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/events/redis.ts) |

## Related

- [Node.js Events](./events-node.md) - In-memory events
- [AWS EventBridge](./events-eventbridge.md) - Cloud-native events
- [Plugins Overview](./) - All available plugins
