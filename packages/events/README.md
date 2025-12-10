[![npm version](https://img.shields.io/npm/v/@unchainedshop/events.svg)](https://npmjs.com/package/@unchainedshop/events)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/events

Event emitter abstraction layer for the Unchained Engine. Provides a pluggable event system for emitting and subscribing to business events.

## Installation

```bash
npm install @unchainedshop/events
```

## Usage

```typescript
import { emit, subscribe, registerEvents } from '@unchainedshop/events';

// Register custom events
registerEvents(['ORDER_CREATED', 'ORDER_PAID']);

// Subscribe to events
subscribe('ORDER_CREATED', ({ payload }) => {
  console.log('Order created:', payload);
});

// Emit events
await emit('ORDER_CREATED', { orderId: '123', total: 99.99 });
```

## API Overview

### Event Functions

| Export | Description |
|--------|-------------|
| `emit` | Emit an event with a payload |
| `subscribe` | Subscribe to an event with a callback handler |
| `registerEvents` | Register new event types |
| `getRegisteredEvents` | Get list of all registered event types |

### Adapter Management

| Export | Description |
|--------|-------------|
| `getEmitAdapter` | Get the current emit adapter |
| `setEmitAdapter` | Set a custom emit adapter |
| `getEmitHistoryAdapter` | Get the current emit history adapter |
| `setEmitHistoryAdapter` | Set a custom emit history adapter |

### Types

| Export | Description |
|--------|-------------|
| `EmitAdapter` | Interface for custom emit adapters |
| `RawPayloadType` | Type for event payload data |

### Built-in Events

| Event | Description |
|-------|-------------|
| `PAGE_VIEW` | Registered by default for page view tracking |

## Custom Adapters

You can implement custom emit adapters for different backends (Redis, Kafka, etc.):

```typescript
import { setEmitAdapter, type EmitAdapter } from '@unchainedshop/events';

const customAdapter: EmitAdapter = {
  publish: async (eventName, payload) => {
    // Custom publish logic
  },
  subscribe: (eventName, callback) => {
    // Custom subscribe logic
  },
};

setEmitAdapter(customAdapter);
```

## License

EUPL-1.2
