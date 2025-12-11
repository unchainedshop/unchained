---
sidebar_position: 18
title: Node.js Event Emitter
sidebar_label: Node.js Events
description: In-memory event system using Node.js EventEmitter
---

# Node.js Event Emitter

The default in-memory event system using Node.js built-in EventEmitter.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/events/node-event-emitter';
```

This plugin automatically calls `setEmitAdapter()` when imported, making it the active event system immediately.

## Features

- **In-Memory**: Events are handled within the same process
- **High Performance**: Fast event handling with no network overhead
- **Simple Setup**: No external dependencies required
- **Development Friendly**: Perfect for development and testing
- **Synchronous**: Events are processed synchronously within the process

## Use Cases

- **Single Instance Deployments**: Applications running on a single server
- **Development Environment**: Local development and testing
- **Simple Applications**: Applications without complex scaling requirements
- **Real-time Processing**: When low latency is critical

## Limitations

- **Single Process**: Events don't cross process boundaries
- **No Persistence**: Events are lost if the process crashes
- **Memory Usage**: All listeners are kept in memory
- **No Distribution**: Cannot scale across multiple instances

## Usage

### Publishing Events

```typescript
import { emit } from '@unchainedshop/events';

await emit('ORDER_CREATE', {
  orderId: '12345',
  userId: 'user123',
  total: 99.99
});
```

### Subscribing to Events

```typescript
import { subscribe } from '@unchainedshop/events';

subscribe('ORDER_CREATE', async (payload) => {
  const { orderId, userId, total } = payload;
  await sendOrderConfirmationEmail(userId, orderId);
});
```

## When to Use

Use the Node.js Event Emitter for:

- Local development
- Testing environments
- Simple applications
- Single server deployments
- When Redis/cloud setup is not feasible

## Adapter Details

| Property | Value |
|----------|-------|
| Source | [events/node-event-emitter.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/events/node-event-emitter.ts) |

## Related

- [Redis Events](./events-redis.md) - Distributed events with Redis
- [AWS EventBridge](./events-eventbridge.md) - Cloud-native events
- [Plugins Overview](./) - All available plugins
