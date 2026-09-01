---
sidebar_position: 18
title: Node.js Event Emitter
sidebar_label: Node.js Events
description: In-memory event system using Node.js EventEmitter
---

# Node.js Event Emitter

The default in-memory event transport, backed by the Node.js built-in `EventEmitter`. Events stay within a single process — use [Redis](./events-redis.md) for multi-instance deployments.

:::info Included in Base Preset
`registerBasePlugins()` (and therefore `registerAllPlugins()`) wires this adapter automatically via `setEmitAdapter()`.
:::

Manual registration is only needed without a preset:

```typescript
import { setEmitAdapter } from '@unchainedshop/events';
import { NodeEventEmitter } from '@unchainedshop/plugins/events/node-event-emitter';

setEmitAdapter(NodeEventEmitter());
```

## Adapter Details

| Property | Value |
|----------|-------|
| Export | `NodeEventEmitter` |
| Source | [events/node-event-emitter.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/events/node-event-emitter.ts) |

For emitting and subscribing to events, see [Event System](../../extend/events.md).

## Related

- [Redis Events](./events-redis.md) - Distributed events with Redis
- [AWS EventBridge](./events-eventbridge.md) - Cloud-native events
