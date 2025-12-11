---
sidebar_position: 4
sidebar_label: Events
title: Event System
description: How to use the built-in Event system
---

# Event System

Unchained uses a publish-subscribe (pub/sub) event model to track events emitted by each module. By default it uses Node.js EventEmitter, but can be extended to connect to distributed event queues like Redis.

## Core API

The `@unchainedshop/events` module exports utility functions for event handling:

```typescript
import { registerEvents, emit, subscribe, getRegisteredEvents } from '@unchainedshop/events';

// Register custom events
registerEvents(['MY_CUSTOM_EVENT']);

// Subscribe to events
subscribe('ORDER_CHECKOUT', ({ payload }) => {
  console.log('Order checked out:', payload.order._id);
});

// Emit events
emit('MY_CUSTOM_EVENT', { data: 'value' });

// Get all registered event names
const allEvents = getRegisteredEvents();
```

### Event Names

Events are registered as strings. You can query available events via GraphQL:

```graphql
query {
  events {
    _id
    type
  }
}
```

Or use `getRegisteredEvents()` at runtime to get the list of registered events.

## Built-in Events

Each module emits events for tracking and integration. See the module documentation for the complete list of events:

| Module | Events Documentation |
|--------|---------------------|
| **Assortments** | [Assortments Module](../platform-configuration/modules/assortments) |
| **Bookmarks** | [Bookmarks Module](../platform-configuration/modules/bookmarks) |
| **Countries** | [Countries Module](../platform-configuration/modules/countries) |
| **Currencies** | [Currencies Module](../platform-configuration/modules/currencies) |
| **Delivery** | [Delivery Module](../platform-configuration/modules/delivery) |
| **Enrollments** | [Enrollments Module](../platform-configuration/modules/enrollments) |
| **Events** | [Events Module](../platform-configuration/modules/events) |
| **Files** | [Files Module](../platform-configuration/modules/files) |
| **Filters** | [Filters Module](../platform-configuration/modules/filters) |
| **Languages** | [Languages Module](../platform-configuration/modules/languages) |
| **Orders** | [Orders Module](../platform-configuration/modules/orders) |
| **Payment** | [Payment Module](../platform-configuration/modules/payment) |
| **Products** | [Products Module](../platform-configuration/modules/products) |
| **Quotations** | [Quotations Module](../platform-configuration/modules/quotations) |
| **Users** | [Users Module](../platform-configuration/modules/users) |
| **Warehousing** | [Warehousing Module](../platform-configuration/modules/warehousing) |
| **Worker** | [Worker Module](../platform-configuration/modules/worker) |

## Subscribing to Events

```typescript
import { subscribe } from '@unchainedshop/events';

// Track order confirmations
subscribe('ORDER_CONFIRMED', async ({ payload }) => {
  const { order } = payload;

  // Send to analytics
  await analytics.track('purchase', {
    orderId: order._id,
    total: order.total,
  });
});

// Track product views
subscribe('PRODUCT_VIEW', async ({ payload }) => {
  await analytics.track('product_view', {
    productId: payload.productId,
  });
});
```

## Custom Events

Register and emit your own events:

```typescript
import { registerEvents, emit, subscribe } from '@unchainedshop/events';

// Register at boot time
registerEvents([
  'INVENTORY_LOW',
  'CUSTOMER_TIER_CHANGED',
  'FRAUD_DETECTED',
]);

// Subscribe to custom event
subscribe('INVENTORY_LOW', async ({ payload }) => {
  await notifyWarehouse(payload.productId, payload.currentStock);
});

// Emit from your code
emit('INVENTORY_LOW', {
  productId: 'product-123',
  currentStock: 5,
  threshold: 10,
});
```

## Custom Event Adapter

Replace the default EventEmitter with a distributed queue like Redis:

```typescript
import { createClient } from '@redis/client';
import { EmitAdapter, setEmitAdapter } from '@unchainedshop/events';

const { REDIS_PORT = 6379, REDIS_HOST = '127.0.0.1' } = process.env;

const subscribedEvents = new Set();

const RedisEventEmitter = (): EmitAdapter => {
  const redisPublisher = createClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
  });

  const redisSubscriber = createClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
  });

  return {
    publish: (eventName, payload) => {
      redisPublisher.publish(eventName, JSON.stringify(payload));
    },
    subscribe: (eventName, callback) => {
      if (!subscribedEvents.has(eventName)) {
        redisSubscriber.subscribe(eventName, (payload) => {
          callback(JSON.parse(payload));
        });
        subscribedEvents.add(eventName);
      }
    },
  };
};

// Set the adapter before starting the platform
setEmitAdapter(RedisEventEmitter());
```

## Use Cases

### Analytics Integration

```typescript
subscribe('ORDER_CHECKOUT', async ({ payload }) => {
  await gtag('event', 'purchase', {
    transaction_id: payload.order._id,
    value: payload.order.total / 100,
    currency: payload.order.currency,
  });
});
```

### Webhook Triggers

```typescript
subscribe('ORDER_CONFIRMED', async ({ payload }) => {
  await fetch('https://your-webhook.com/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload.order),
  });
});
```

### Inventory Alerts

```typescript
subscribe('ORDER_ADD_PRODUCT', async ({ payload, context }) => {
  const product = await context.modules.products.findProduct({
    productId: payload.orderPosition.productId,
  });

  if (product.stock < 10) {
    emit('INVENTORY_LOW', {
      productId: product._id,
      currentStock: product.stock,
    });
  }
});
```

### Audit Logging

```typescript
const auditEvents = [
  'ORDER_CHECKOUT',
  'USER_CREATE',
  'PRODUCT_UPDATE',
  'PAYMENT_PROVIDER_CREATE',
];

auditEvents.forEach(eventName => {
  subscribe(eventName, async ({ payload }) => {
    await db.auditLog.insertOne({
      event: eventName,
      payload,
      timestamp: new Date(),
    });
  });
});
```

## Querying Registered Events

Use GraphQL to list all registered events:

```graphql
query {
  events {
    _id
    type
  }
}
```

## Related

- [Events Module](../platform-configuration/modules/events) - Module configuration
- [Worker](./worker) - Background job processing
