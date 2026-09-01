---
sidebar_position: 20
title: AWS EventBridge
sidebar_label: AWS EventBridge
description: Enterprise event system using AWS EventBridge
---

# AWS EventBridge

Publish-only event transport that forwards every emitted event to an AWS EventBridge bus (`Source`, `DetailType` = event name, `Detail` = JSON payload). Subscribing from the application is not supported — use EventBridge rules to route events to Lambda, SQS, SNS, or other targets.

Requires the `@aws-sdk/client-eventbridge` peer dependency:

```bash
npm install @aws-sdk/client-eventbridge
```

## Registration

The EventBridge transport does not auto-register. The factory is async and takes the AWS configuration as arguments (credentials are resolved by the AWS SDK's default provider chain):

```typescript
import { setEmitAdapter } from '@unchainedshop/events';
import { EventBridgeEventEmitter } from '@unchainedshop/plugins/events/aws-eventbridge';

setEmitAdapter(
  await EventBridgeEventEmitter({
    region: 'us-east-1',
    source: 'com.mycompany.unchained',
    busName: 'unchained-events',
  }),
);
```

## Adapter Details

| Property | Value |
|----------|-------|
| Export | `EventBridgeEventEmitter` |
| Behavior | `publish` only; `subscribe` throws |
| Source | [events/aws-eventbridge.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/events/aws-eventbridge.ts) |

For emitting events, see [Event System](../../extend/events.md).

## Related

- [Node.js Events](./events-node.md) - In-memory events
- [Redis Events](./events-redis.md) - Distributed events with Redis
