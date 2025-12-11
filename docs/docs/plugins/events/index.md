---
sidebar_position: 8
title: Event Plugins
sidebar_label: Events
description: Event system plugins for Unchained Engine
---

# Event Plugins

Event plugins provide different backends for the event system.

| Import Path | Description |
|-------------|-------------|
| [`@unchainedshop/plugins/events/node-event-emitter`](./events-node.md) | In-memory events (default) |
| [`@unchainedshop/plugins/events/redis`](./events-redis.md) | Distributed events with Redis |
| [`@unchainedshop/plugins/events/aws-eventbridge`](./events-eventbridge.md) | AWS EventBridge integration |

## Choosing an Event Backend

- **Node Event Emitter**: Best for single-instance deployments. Simple, no external dependencies.
- **Redis**: Best for multi-instance deployments. Enables distributed event handling.
- **AWS EventBridge**: Best for serverless architectures and AWS-centric deployments.
