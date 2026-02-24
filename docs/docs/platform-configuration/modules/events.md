---
sidebar_position: 13
title: Events Module
sidebar_label: Events
description: Event history and audit trail
---

# Events Module

The events module persists all emitted events to the database for auditing, analytics, and event sourcing patterns.

## Configuration Options

The events module has no configuration options.

## Module API

Access via `modules.events` in the Unchained API context.

### Queries

| Method | Arguments | Description |
|--------|-----------|-------------|
| `findEvent` | `{ eventId }, options?` | Find a specific event |
| `findEvents` | `{ limit?, offset?, ...query }` | List events with pagination |
| `count` | `query` | Count events matching criteria |
| `getReport` | `{ eventNames?, from?, to? }` | Get aggregated event statistics |

### Usage

```typescript
// List recent order events
const events = await modules.events.findEvents({
  types: ['ORDER_CREATE', 'ORDER_CHECKOUT', 'ORDER_CONFIRMED'],
  limit: 50,
});

// Get event statistics for a date range
const report = await modules.events.getReport({
  eventNames: ['ORDER_CONFIRMED'],
  from: new Date('2024-01-01'),
  to: new Date('2024-12-31'),
});

// Count specific events
const count = await modules.events.count({
  types: ['PRODUCT_UPDATE'],
});
```

## Events

The events module does not emit events itself — it receives and stores events emitted by all other modules.

## Event Types

Every module emits events for state changes. Common patterns:

| Module | Events |
|--------|--------|
| Orders | `ORDER_CREATE`, `ORDER_UPDATE`, `ORDER_CHECKOUT`, `ORDER_CONFIRMED`, `ORDER_FULFILLED`, `ORDER_REJECTED` |
| Products | `PRODUCT_CREATE`, `PRODUCT_UPDATE`, `PRODUCT_REMOVE`, `PRODUCT_PUBLISH`, `PRODUCT_UNPUBLISH` |
| Users | `USER_CREATE`, `USER_UPDATE`, `USER_REMOVE` |

See individual module documentation for complete event lists.

## Related

- [Events Extension](../../extend/events.md) - Custom event listeners
- [Event Plugins](../../plugins/events/index.md) - Event transport adapters
