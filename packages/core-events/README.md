[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-events.svg)](https://npmjs.com/package/@unchainedshop/core-events)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-events

Event history module for the Unchained Engine. Persists emitted events to the database and provides querying capabilities for event analytics and auditing.

## Installation

```bash
npm install @unchainedshop/core-events
```

## Usage

```typescript
import { configureEventsModule } from '@unchainedshop/core-events';

const eventsModule = await configureEventsModule({ db });

// Find events by type
const orderEvents = await eventsModule.findEvents({
  types: ['ORDER_CREATE', 'ORDER_PAID'],
  limit: 100,
});

// Get event statistics
const report = await eventsModule.getReport({
  types: ['ORDER_CREATE'],
  dateRange: { start: '2024-01-01', end: '2024-12-31' },
});
```

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configureEventsModule` | Configure and return the events module |

### Queries

| Method | Description |
|--------|-------------|
| `findEvent` | Find a single event by ID or filter |
| `findEvents` | Find events with filtering, sorting, and pagination |
| `count` | Count events matching query |
| `getReport` | Get aggregated event statistics by type and date |

### Mutations

| Method | Description |
|--------|-------------|
| `create` | Create a new event record |

### Helper Methods

| Method | Description |
|--------|-------------|
| `type` | Get event type, returns 'UNKNOWN' for unregistered types |

### Types

| Export | Description |
|--------|-------------|
| `Event` | Event document type |
| `EventQuery` | Query parameters type |
| `EventReport` | Report output type |
| `EventsModule` | Module interface type |

## Event History

This module automatically integrates with `@unchainedshop/events` to persist all emitted events to the database. Events are stored with:

- Event type
- Payload data
- Timestamp

This enables event sourcing patterns, audit trails, and analytics.

## License

EUPL-1.2
