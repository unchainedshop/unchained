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

Events are registered as strings. You can query the registered event names via GraphQL:

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

The callback receives `{ payload }` only — the data passed to `emit`. There is no context argument; if you need modules, capture the `unchainedAPI` returned by `startPlatform`.

```typescript
import { subscribe } from '@unchainedshop/events';
import { OrderPricingSheet } from '@unchainedshop/core';

// Track order confirmations. The payload contains the raw order document:
// totals live in `order.calculation` (pricing rows), the currency in `order.currencyCode`.
subscribe('ORDER_CONFIRMED', async ({ payload }) => {
  const { order } = payload;
  const { amount } = OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
  }).total();

  // Send to analytics
  await analytics.track('purchase', {
    orderId: order._id,
    total: amount,
  });
});

// Track page views (emitted by Mutation.pageView)
subscribe('PAGE_VIEW', async ({ payload }) => {
  await analytics.track('page_view', {
    path: payload.path,
    referrer: payload.referrer,
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
    // Optional: close long-lived connections on platform shutdown
    shutdown: async () => {
      await Promise.allSettled([redisPublisher.close(), redisSubscriber.close()]);
    },
  };
};

// Set the adapter before starting the platform
setEmitAdapter(RedisEventEmitter());
```

:::note Built-in transports must be registered explicitly
Unchained ships Redis and AWS EventBridge transports, but they **do not auto-register on import**. Register them yourself before `startPlatform`:

```typescript
import { setEmitAdapter } from '@unchainedshop/events';
import { RedisEventEmitter } from '@unchainedshop/plugins/events/redis';

setEmitAdapter(RedisEventEmitter());
```

The Node.js in-memory emitter is wired automatically by `registerBasePlugins()`. The optional `EmitAdapter.shutdown()` is called by `startPlatform` on graceful shutdown.
:::

## Use Cases

### Analytics Integration

```typescript
subscribe('ORDER_CHECKOUT', async ({ payload }) => {
  const { order } = payload;
  const { amount, currencyCode } = OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
  }).total();

  await gtag('event', 'purchase', {
    transaction_id: order._id,
    value: amount / 100,
    currency: currencyCode,
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
subscribe('ORDER_ADD_PRODUCT', async ({ payload }) => {
  const { orderPosition } = payload;
  const stock = await inventorySystem.getStock(orderPosition.productId);

  if (stock < 10) {
    emit('INVENTORY_LOW', {
      productId: orderPosition.productId,
      currentStock: stock,
    });
  }
});
```

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
    await db.auditLog.insertOne({
      event: eventName,
      payload,
      timestamp: new Date(),
    });
  });
});
```

## Querying Registered Events

Use GraphQL to list all registered event types:

```graphql
query {
  registeredEventTypes
}
```

To query the *emitted* event documents instead, use `events { _id type }` (paginated, sorted by creation date).

## Audit Logging (OCSF)

Unchained provides enterprise-grade audit logging based on the **OCSF (Open Cybersecurity Schema Framework)** - an industry-standard schema supported by AWS Security Lake, Datadog, Splunk, Google Chronicle, and other SIEM systems.

Audit events are designed to be consumed by an external monitoring agent: by default every event is emitted as a structured log line (scrape it from stdout with any log shipper), and optionally pushed directly to an OTLP-compatible collector. The engine does not persist audit events itself — retention, queries, and integrity guarantees are the consuming log pipeline's or SIEM's concern.

### Features

- **OCSF v1.4.0 compliant** - Industry-standard event schema
- **Structured log emission** - Every event as one JSON log line on stdout (default)
- **OTLP push** - Optional OTLP/HTTP push to any OpenTelemetry-compatible collector
- **SIEM-ready** - OCSF format for direct ingestion into security monitoring tools

### Quick Start

Audit logging is automatically enabled when using `startPlatform()` — every captured event is emitted through the `unchained:audit` logger:

```typescript
import { startPlatform } from '@unchainedshop/platform';

// Default: audit events are emitted as structured log lines
const platform = await startPlatform({
  modules: defaultModules,
});

// Opt into OTLP push:
const platform = await startPlatform({
  modules: defaultModules,
  auditLog: {
    collectorUrl: 'http://otel-collector:4318/v1/logs', // push to an OTLP collector
  },
});

// To disable audit logging:
const platform = await startPlatform({
  modules: defaultModules,
  auditLog: false,
});
```

When enabled, the following events are automatically captured (97 event types in total, see `AUDITED_EVENTS`):

- `API_LOGIN_TOKEN_CREATED` → Authentication (LOGON)
- `API_LOGIN_FAILED` → Authentication (LOGON, failure)
- `API_LOGOUT` → Authentication (LOGOFF)
- `USER_CREATE` → Account Change (CREATE)
- `USER_REMOVE` → Account Change (DELETE)
- `USER_UPDATE_PASSWORD` → Account Change (PASSWORD_CHANGE)
- `USER_ADD_ROLES` → Account Change (ATTACH_POLICY)
- `ORDER_CREATE` → API Activity (CREATE)
- `ORDER_CHECKOUT` → API Activity (CHECKOUT)
- `ORDER_PAY` → API Activity (PAYMENT)
- And more...

### Structured Log Emission (default)

Each audit event is logged at `info` level on the `unchained:audit` logger with the full OCSF event under the `ocsf` key. Set `UNCHAINED_LOG_FORMAT=json` so stdout carries one machine-parseable JSON line per event:

```json
{"timestamp":"2026-09-01T09:12:00.000Z","level":"INFO","name":"unchained:audit","message":"User Login","ocsf":{"category_uid":3,"class_uid":3002,"activity_id":1,"severity_id":1,"status_id":1,"time":1788253920000,"metadata":{"version":"1.4.0","uid":"..."},"user":{"uid":"...","name":"admin"},"src_endpoint":{"ip":"203.0.113.7"}}}
```

Any log-shipping agent can pick these lines up from container stdout. Example OpenTelemetry Collector configuration using the `filelog` receiver:

```yaml
receivers:
  filelog:
    include: [/var/log/containers/unchained-*.log]
    operators:
      - type: json_parser
      - type: filter
        expr: 'attributes.name != "unchained:audit"'

exporters:
  otlphttp:
    endpoint: https://your-siem.example.com

service:
  pipelines:
    logs:
      receivers: [filelog]
      exporters: [otlphttp]
```

Vector, Fluent Bit, Promtail/Alloy and vendor agents (Datadog, Splunk, Elastic) work the same way: parse the JSON line, route on `name == "unchained:audit"`, and forward the `ocsf` payload.

To silence the log emission (e.g. when only using OTLP push), set `auditLog: { log: false }`.

### OTLP Push (opt-in)

The engine can push audit events directly to any OTLP/HTTP-compatible logs endpoint (OpenTelemetry Collector, Vector, Fluent Bit, vendor OTLP intakes). Events are sent as OTLP `resourceLogs` — the full OCSF event forms the log record body, with key fields (`ocsf.class_uid`, `user.id`, `client.address`, ...) duplicated as attributes for routing and filtering:

```typescript
const platform = await startPlatform({
  modules: defaultModules,
  auditLog: {
    collectorUrl: 'http://otel-collector:4318/v1/logs',
    collectorHeaders: {
      Authorization: 'Bearer <token>',
    },
    batchSize: 10, // Flush after 10 events (default: 10)
    flushIntervalMs: 5000, // Or flush every 5 seconds (default: 5000)
  },
});
```

The standard OpenTelemetry environment variables are honored as fallbacks, so an operator can enable push without code changes:

- `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` — used verbatim as the logs endpoint
- `OTEL_EXPORTER_OTLP_ENDPOINT` — base endpoint, `/v1/logs` is appended
- `OTEL_EXPORTER_OTLP_HEADERS` / `OTEL_EXPORTER_OTLP_LOGS_HEADERS` — `key=value,key=value` header lists
- `OTEL_SERVICE_NAME` — sets the `service.name` resource attribute (default: `unchained-engine`)

If the collector is unreachable, batches are re-queued and retried on the next flush. The queue is capped (`maxQueueSize`, default 1000); beyond the cap the oldest events are dropped and a warning is logged.

### Manual Logging

For custom audit events, use the singleton instance:

```typescript
import {
  getAuditLogInstance,
  OCSF_AUTH_ACTIVITY,
  OCSF_ACCOUNT_ACTIVITY,
  OCSF_API_ACTIVITY,
} from '@unchainedshop/events';

const auditLog = getAuditLogInstance();

// Log authentication event
await auditLog.logAuthentication({
  activity: OCSF_AUTH_ACTIVITY.LOGON,
  userId: user._id,
  userName: user.email,
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

### OCSF Event Classes

| Class | UID | Use Cases |
|-------|-----|-----------|
| **Authentication** | 3002 | Login, logout, failed login, MFA |
| **Account Change** | 3001 | User CRUD, password changes, role changes |
| **API Activity** | 6003 | API access, payments, orders, access denied |

### SIEM Integration

Audit events use the OCSF v1.4.0 format and reach SIEM systems through:

1. **Structured log scraping** (default) — Ship the `unchained:audit` JSON lines from stdout with any log agent (OpenTelemetry Collector `filelog`, Vector, Fluent Bit, Promtail/Alloy, vendor agents)
2. **OTLP Push** — Real-time OTLP/HTTP push to a collector via `collectorUrl` or the `OTEL_EXPORTER_OTLP_*` environment variables

**Supported SIEM systems** (via OCSF format):
- AWS Security Lake (direct ingestion)
- Splunk (OCSF add-on)
- Datadog Cloud SIEM
- Google Chronicle / SecOps
- CrowdStrike Falcon LogScale
- Elastic Security

### Configuration Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `log` | `boolean` | `true` | Emit each event as a structured log line via the `unchained:audit` logger |
| `collectorUrl` | `string` | `OTEL_EXPORTER_OTLP_*` env | OTLP/HTTP logs endpoint for real-time push |
| `collectorHeaders` | `Record<string, string>` | `OTEL_EXPORTER_OTLP_*_HEADERS` env | HTTP headers for collector auth |
| `batchSize` | `number` | `10` | Number of events to batch before pushing |
| `flushIntervalMs` | `number` | `5000` | Max interval (ms) between pushes |
| `maxQueueSize` | `number` | `1000` | Push queue cap; oldest events are dropped beyond it |

### Shutdown

When using `startPlatform()`, audit log shutdown is handled automatically. The platform flushes pending HTTP collector events and waits for the write lock to complete before exiting.

## Related

- [Security](../deployment/security) - Security features and compliance
- [Events Module](../platform-configuration/modules/events) - Module configuration
- [Worker](./worker) - Background job processing
