---
sidebar_position: 20
title: AWS EventBridge
sidebar_label: AWS EventBridge
description: Publish Unchained events to AWS EventBridge
---

# AWS EventBridge

The adapter sends events to an EventBridge bus with the event name as `DetailType`, the configured source as `Source`, and the JSON payload envelope as `Detail`.

## Installation

```bash
npm install @aws-sdk/client-eventbridge
```

Configure the environment before importing:

```bash
EVENT_BRIDGE_REGION=us-east-1
EVENT_BRIDGE_SOURCE=com.mycompany.unchained
EVENT_BRIDGE_BUS_NAME=unchained-events
```

```typescript
import '@unchainedshop/plugins/events/aws-eventbridge.js';
```

The import constructs the adapter and calls `setEmitAdapter()` when all three settings are present. `EventBridgeEventEmitter` is an internal factory and is not exported. The AWS SDK resolves credentials from its configured credential providers.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EVENT_BRIDGE_REGION` | Unset | AWS region; required for registration |
| `EVENT_BRIDGE_SOURCE` | Unset | Event source; required for registration |
| `EVENT_BRIDGE_BUS_NAME` | Unset | Event bus name; required for registration |
| `AWS_ACCESS_KEY_ID` | Unset | Optional environment-based AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Unset | Optional environment-based AWS secret key |
| `AWS_SESSION_TOKEN` | Unset | Session token when using temporary credentials |

The destination bus must exist and the credentials must permit `events:PutEvents`.

## Subscription and Delivery Limits

This adapter publishes events only. Its `subscribe()` method throws. The standard platform registers local subscriptions during startup, so replacing its emitter with this adapter requires a custom composite adapter that preserves local subscription delivery and forwards events to EventBridge.

Configure EventBridge rules and targets separately for remote consumers. This plugin does not provision rules, archives, replay, or a schema registry.

Publishing is asynchronous: `emit()` does not wait for EventBridge delivery. The adapter logs rejected SDK calls and does not inspect individual entry failures in successful responses.

## Related

- [Node.js Events](./events-node.md)
- [Redis Events](./events-redis.md)
- [Adapter source](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/events/aws-eventbridge.ts)
