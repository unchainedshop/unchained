---
sidebar_position: 8
title: Event Plugins
sidebar_label: Events
description: Event system plugins for Unchained Engine
---

# Event Plugins

Event transports implement the `EmitAdapter` interface from `@unchainedshop/events` and are activated with `setEmitAdapter()` — they do not use the standard plugin registry. See [Event System](../../extend/events.md) for the event API itself.

| Import Path | Description |
|-------------|-------------|
| [`@unchainedshop/plugins/events/node-event-emitter`](./events-node.md) | In-memory events (default, wired by the base preset) |
| [`@unchainedshop/plugins/events/redis`](./events-redis.md) | Distributed events with Redis pub/sub |
| [`@unchainedshop/plugins/events/aws-eventbridge`](./events-eventbridge.md) | AWS EventBridge integration (publish-only) |

## Choosing an Event Backend

- **Node Event Emitter**: Single-instance deployments. No external dependencies.
- **Redis**: Multi-instance deployments that need distributed event handling.
- **AWS EventBridge**: Routing events into AWS services; subscribing from the application is not supported.
