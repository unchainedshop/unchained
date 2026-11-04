[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-events.svg)](https://npmjs.com/package/@unchainedshop/core-events)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-events

Event history module for the Unchained Engine. Persists emitted events to the database and provides querying capabilities for event analytics and auditing.

## Installation

```bash
npm install @unchainedshop/core-events
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.events` and installs the database history adapter if none is already configured.

```typescript
const { events } = platform.unchainedAPI.modules;

const orderEvents = await events.findEvents({
  types: ['ORDER_CREATE', 'ORDER_PAY'],
  limit: 100,
});
const report = await events.getReport({ types: ['ORDER_CREATE'] });
```

Records contain the event type, payload, and creation timestamp. The TTL index removes records after `EVENTS_TTL_SECONDS` (default: 172800 seconds, or two days). Configure long-term audit retention through your logging pipeline.

Stored payloads are redacted copies: the values of `defaultRedactedPayloadFields` (`token`, `password`, `plainPassword`, `hashedToken`, …) become `******`, at any depth and case-insensitively. Configure the keys with `options.events.redactedPayloadFields`, and add `contactDataPayloadFields` (e-mail addresses, phone numbers, names, postal addresses) with `options.events.redactContactData: true`. Subscribers and emit adapters get the payload as emitted.

See the [module guide](https://docs.unchained.shop/platform-configuration/modules/events), [public exports](src/events-index.ts), and [module implementation](src/module/configureEventsModule.ts).

## License

EUPL-1.2
