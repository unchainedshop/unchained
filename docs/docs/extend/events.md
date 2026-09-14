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

Events are registered as strings. Query registered names via GraphQL (subject to API permissions):

```graphql
query {
  registeredEventTypes
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

Register subscribers after the platform has registered its built-in events. The
examples below assume an application-provided `analytics` client. Subscriber
callbacks receive `{ payload }`; they do not receive the GraphQL context.
The emitter does not await asynchronous subscribers, so handle failures or enqueue
work when delivery and retry guarantees matter.

```typescript
import { subscribe } from '@unchainedshop/events';
import { OrderPricingSheet } from '@unchainedshop/core';

// Track order confirmations
subscribe('ORDER_CONFIRMED', async ({ payload }) => {
  const { order } = payload;

  // Send to analytics
  await analytics.track('purchase', {
    orderId: order._id,
    total: OrderPricingSheet({
      calculation: order.calculation,
      currencyCode: order.currencyCode,
    }).total({ useNetPrice: false }),
  });
});

// Track product changes
subscribe('PRODUCT_UPDATE', async ({ payload }) => {
  await analytics.track('product_update', {
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

An adapter implements `publish(eventName, { payload })` and
`subscribe(eventName, callback)`. For example, this adapter uses a local emitter:

```typescript
import { EventEmitter } from 'node:events';
import { setEmitAdapter, type EmitAdapter } from '@unchainedshop/events';

const emitter = new EventEmitter();
const adapter: EmitAdapter = {
  publish: (eventName, message) => {
    emitter.emit(eventName, message);
  },
  subscribe: (eventName, callback) => {
    emitter.on(eventName, callback);
  },
};

// Configure after importing presets and before starting the platform.
setEmitAdapter(adapter);
```

For a remote transport, connect clients before use, support all subscribers, and
handle publish/subscribe errors and shutdown in your integration. The event
interface itself does not provide connection or unsubscribe hooks. See the
[Redis adapter](../plugins/events/events-redis.md) for the bundled adapter's current limitations.

## Use Cases

### Analytics Integration

Build totals with `OrderPricingSheet` as in the subscription example above.
The result contains `amount` and `currencyCode`. Convert minor units according
to the currency's precision if the analytics destination expects major units;
do not assume that every currency has two decimal places.

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

`ORDER_ADD_PRODUCT` includes `payload.orderPosition`. Capture the initialized
platform's `modules` and `services` in your subscriber closure, load the product
with `modules.products.findProduct({ productId })`, and inspect the per-provider
quantities from `services.products.simulateProductInventory({ product })`.
Product records do not have a `stock` field. Emit your registered `INVENTORY_LOW`
event when your application's threshold and warehouse-selection rules require it.

### Audit Logging

Unchained provides built-in OCSF-compliant audit logging. See the [dedicated Audit Logging section](#audit-logging-ocsf) below for the recommended approach.

For simple custom audit logging:

```typescript
const auditEvents = [
  'ORDER_CHECKOUT',
  'USER_CREATE',
  'PRODUCT_UPDATE',
  'PAYMENT_PROVIDER_CREATE',
];

auditEvents.forEach(eventName => {
  subscribe(eventName, async ({ payload }) => {
    await db.collection('audit_log').insertOne({
      event: eventName,
      payload,
      timestamp: new Date(),
    });
  });
});
```

## Querying Registered Events

Use `registeredEventTypes` to list registered names. The separate `events` query returns persisted event history, not the registration list:

```graphql
query {
  registeredEventTypes
}
```

## Audit Logging (OCSF)

Unchained provides enterprise-grade audit logging based on the **OCSF (Open Cybersecurity Schema Framework)** - an industry-standard schema supported by AWS Security Lake, Datadog, Splunk, Google Chronicle, and other SIEM systems.

### Features

- **OCSF v1.4.0 compliant** - Industry-standard event schema
- **Tamper-evident** - SHA-256 hash chain for integrity verification
- **Append-only** - No update or delete operations
- **JSON Lines format** - Easy parsing and integration
- **SIEM-ready** - Direct ingestion into security monitoring tools
- **HTTP push** - Optional JSON batches to a receiver accepting `{ events: [...] }`

### Quick Start

```typescript
import { createAuditLog, configureAuditIntegration } from '@unchainedshop/events';

// Create audit log instance
const auditLog = createAuditLog('./audit-logs');

// Enable capture for the built-in AUDITED_EVENTS after platform initialization
configureAuditIntegration(auditLog);

// Events automatically captured:
// - API_LOGIN_TOKEN_CREATED → Authentication (LOGON)
// - API_LOGOUT → Authentication (LOGOFF)
// - USER_CREATE → Account Change (CREATE)
// - USER_REMOVE → Account Change (DELETE)
// - USER_UPDATE_PASSWORD → Account Change (PASSWORD_CHANGE)
// - USER_ADD_ROLES → Account Change (ATTACH_POLICY)
// - ORDER_CREATE → API Activity (CREATE)
// - ORDER_CHECKOUT → API Activity (CHECKOUT)
// - ORDER_PAY → API Activity (PAYMENT)
// - And more...
```

### Manual Logging

For custom audit events:

```typescript
import {
  createAuditLog,
  OCSF_AUTH_ACTIVITY,
  OCSF_ACCOUNT_ACTIVITY,
  OCSF_API_ACTIVITY,
} from '@unchainedshop/events';

const auditLog = createAuditLog('./audit-logs');

// Log authentication event
await auditLog.logAuthentication({
  activity: OCSF_AUTH_ACTIVITY.LOGON,
  userId: user._id,
  userName: user.emails?.[0]?.address,
  success: true,
  remoteAddress: req.ip,
  sessionId: req.sessionID,
  isMfa: true,
});

// Log failed login attempt
await auditLog.logAuthentication({
  activity: OCSF_AUTH_ACTIVITY.LOGON,
  success: false,
  remoteAddress: req.ip,
  message: 'Invalid password',
});

// Log account change (role assignment)
await auditLog.logAccountChange({
  activity: OCSF_ACCOUNT_ACTIVITY.ATTACH_POLICY,
  userId: targetUser._id,
  actorUserId: adminUser._id,
  success: true,
  message: 'Admin role assigned',
});

// Log API activity (payment)
await auditLog.logApiActivity({
  activity: OCSF_API_ACTIVITY.PAYMENT,
  userId: user._id,
  operation: 'processPayment',
  success: true,
  message: 'Payment completed',
});

// Log access denied
await auditLog.logApiActivity({
  activity: OCSF_API_ACTIVITY.ACCESS_DENIED,
  userId: user._id,
  success: false,
  message: 'Insufficient permissions',
});
```

### HTTP Collector Push

Push audit logs to an HTTP receiver that accepts `application/json` with an `events` array. An OTLP receiver needs a translation step; this payload is not OTLP:

```typescript
const auditLog = createAuditLog({
  directory: './audit-logs',
  collectorUrl: 'http://audit-collector:8080/events',
  collectorHeaders: {
    'Authorization': 'Bearer <token>',
  },
  batchSize: 10,
  flushIntervalMs: 5000,
});
```

### Querying Audit Logs

```typescript
import { OCSF_CLASS } from '@unchainedshop/events';

// Find failed login attempts
const failedLogins = await auditLog.find({
  classUids: [OCSF_CLASS.AUTHENTICATION],
  success: false,
  startTime: new Date('2024-01-01'),
  limit: 100,
});

// Get failed login count for rate limiting
const attempts = await auditLog.getFailedLogins({
  remoteAddress: '192.168.1.1',
  since: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
});

// Verify integrity of audit log chain
const result = await auditLog.verify();
if (!result.valid) {
  console.error('Audit log tampering detected:', result.error);
}
```

### OCSF Event Classes

| Class | UID | Use Cases |
|-------|-----|-----------|
| **Authentication** | 3002 | Login, logout, failed login, MFA |
| **Account Change** | 3001 | User CRUD, password changes, role changes |
| **API Activity** | 6003 | API access, payments, orders, access denied |

### SIEM Integration

Audit log files (`audit-YYYY-MM-DD.jsonl`) can be directly ingested by SIEM systems:

**Filebeat (Elastic):**
```yaml
filebeat.inputs:
  - type: log
    paths:
      - /path/to/audit-logs/*.jsonl
    json.keys_under_root: true
```

**Promtail (Loki/Grafana):**
```yaml
scrape_configs:
  - job_name: unchained-audit
    static_configs:
      - targets: [localhost]
        labels:
          job: audit
          __path__: /path/to/audit-logs/*.jsonl
```

### Shutdown

Stop event producers before closing the audit log on shutdown to flush pending events. `configureAuditIntegration` does not return an unsubscribe function:

```typescript
process.on('SIGTERM', async () => {
  await auditLog.close();
  process.exit(0);
});
```

## Related

- [Security](../deployment/security) - Security features and compliance
- [Events Module](../platform-configuration/modules/events) - Module configuration
- [Worker](./worker) - Background job processing
