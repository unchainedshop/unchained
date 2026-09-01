---
sidebar_position: 19
title: Redis Events
sidebar_label: Redis Events
description: Distributed event system using Redis pub/sub
---

# Redis Events

Distributed event transport using Redis pub/sub, for deployments with multiple application instances. Payloads are JSON-serialized; connections are closed on platform shutdown via the adapter's `shutdown()` hook.

Requires the `@redis/client` peer dependency:

```bash
npm install @redis/client
```

## Registration

The Redis transport does not auto-register. Activate it with `setEmitAdapter()` before `startPlatform` (after `registerBasePlugins()`/`registerAllPlugins()`, which set the Node.js emitter):

```typescript
import { setEmitAdapter } from '@unchainedshop/events';
import { RedisEventEmitter } from '@unchainedshop/plugins/events/redis';

setEmitAdapter(RedisEventEmitter());
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_HOST` | - | Redis server hostname (required) |
| `REDIS_PORT` | `6379` | Redis server port |
| `REDIS_DB` | `0` | Redis database number |

## Adapter Details

| Property | Value |
|----------|-------|
| Export | `RedisEventEmitter` |
| Source | [events/redis.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/events/redis.ts) |

For emitting and subscribing to events, see [Event System](../../extend/events.md).

## Related

- [Node.js Events](./events-node.md) - In-memory events
- [AWS EventBridge](./events-eventbridge.md) - Cloud-native events
