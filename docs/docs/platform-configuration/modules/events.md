---
sidebar_position: 13
title: Events Module
sidebar_label: Events
description: Event history and audit trail
---

# Events Module

The events module installs a database history adapter when no custom history adapter is configured. It records emitted events for inspection and analytics, with secrets in their payloads [redacted](#redacting-payloads). Records expire after `EVENTS_TTL_SECONDS` (default: two days); use the audit logging pipeline for longer retention.

## Configuration Options

```typescript
export interface EventsSettingsOptions {
  redactedPayloadFields?: string[] | null;
  redactContactData?: boolean;
}
```

### Redacting Payloads

Security Feature.

Before a payload is written to the `events` collection (by the history adapter or `modules.events.create`), the values of redacted keys are replaced with `******`, at any depth. Keys match case-insensitively. The module stores a copy: subscribers and emit adapters (Node.js, Redis, EventBridge) get the payload as emitted, so templates and integrations that read a token or the order contact keep working.

If `redactedPayloadFields` is not configured, the keys of `defaultRedactedPayloadFields` from `@unchainedshop/core-events` are redacted: the [obfuscated work fields](./worker.md#blacklisting-variables) (`password`, `newPassword`, `oldPassword`, `authorization`, `secret`, `accessKey`, `accessToken`, `token`) and `plainPassword`, `hashedToken`, `refreshToken`, `idToken`, `apiKey`, `clientSecret` and `privateKey`. This keeps the plain tokens of `USER_ACCOUNT_ACTION` (password reset, e-mail verification, enrollment) out of the history. A custom list replaces the defaults, `[]` stores payloads as emitted.

`redactContactData: true` also redacts the keys of `contactDataPayloadFields`: `emailAddress`, `email`, `address`, `recipientEmail`, `telNumber`, `phoneMobile`, `username`, `userName`, `displayName`, `firstName`, `lastName`, `company`, `addressLine`, `addressLine2`, `postalCode` and `city`. This covers the order contact and billing address in the `ORDER_*` events, the e-mail addresses, profile and last contact of users in the `USER_*` events and the address in `USER_ACCOUNT_ACTION`.

```typescript
import { defaultRedactedPayloadFields } from '@unchainedshop/core-events';

await startPlatform({
  options: {
    events: {
      // A login code is a secret here; `code` also matches discount and error codes
      redactedPayloadFields: [...defaultRedactedPayloadFields, 'code'],
      redactContactData: true,
    },
  },
});
```

A redacted key that holds a plain object is not replaced: its keys are redacted in turn, so the warehousing token in `TOKEN_INVALIDATED` and the user profile's `address` keep their structure. Other keys, such as `remoteAddress`, `userAgent` or the `text` of mail work in `WORK_*` events, can be added to the list. `WORK_*` payloads are already obfuscated with [`options.worker.blacklistedVariables`](./worker.md#blacklisting-variables) when they are emitted.

## Module API

Access via `modules.events` in the Unchained API context.

### Queries

| Method | Arguments | Description |
|--------|-----------|-------------|
| `findEvent` | `{ eventId }, options?` | Find a specific event |
| `findEvents` | `{ limit?, offset?, ...query }` | List events with pagination |
| `count` | `query` | Count events matching criteria |
| `getReport` | `{ dateRange?, types? }` | Get aggregated event statistics |

### Usage

```typescript
// List recent order events
const events = await modules.events.findEvents({
  types: ['ORDER_CREATE', 'ORDER_CHECKOUT', 'ORDER_CONFIRMED'],
  limit: 50,
});

// Get event statistics for a date range
const report = await modules.events.getReport({
  types: ['ORDER_CONFIRMED'],
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
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
