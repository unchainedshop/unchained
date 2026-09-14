[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-worker.svg)](https://npmjs.com/package/@unchainedshop/core-worker)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-worker

Background job queue module for the Unchained Engine. Provides a work queue system for async task processing with plugin-based workers.

## Installation

```bash
npm install @unchainedshop/core-worker
```

## Usage

```typescript
import { configureWorkerModule, WorkStatus } from '@unchainedshop/core-worker';

const workerModule = await configureWorkerModule({ db, migrationRepository });

// Add a work item to the queue
const work = await workerModule.addWork({
  type: 'EMAIL',
  input: {
    to: 'user@example.com',
    subject: 'Order confirmation',
    text: 'Thank you for your order.',
  },
});

// Find pending work
const pendingWork = await workerModule.findWorkQueue({
  status: [WorkStatus.NEW],
});

// Read the queued work item
const queuedWork = await workerModule.findWork({ workId: work._id });
```

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configureWorkerModule` | Configure and return the worker module |

### Queries

| Method | Description |
|--------|-------------|
| `findWork` | Find work item by ID |
| `findWorkQueue` | Find work items with filtering |
| `count` | Count work items matching query |

### Mutations

| Method | Description |
|--------|-------------|
| `addWork` | Add work item to queue |
| `allocateWork` | Allocate work to a worker |
| `finishWork` | Record a work result |
| `rescheduleWork` | Reschedule failed work |
| `deleteWork` | Delete a work item |

### Constants

| Export | Description |
|--------|-------------|
| `WorkStatus` | Status values (NEW, ALLOCATED, SUCCESS, FAILED, DELETED) |

### Types

| Export | Description |
|--------|-------------|
| `Work` | Work item document type |
| `WorkerModule` | Module interface type |

## Work Types

Work types are linked to worker plugins. Common built-in types:

| Type | Description |
|------|-------------|
| `EMAIL` | Send email notifications |
| `HEARTBEAT` | Keep-alive jobs |
| `HTTP_REQUEST` | Make HTTP requests |

## Worker Plugins

Workers process jobs by type. The plugin is responsible for:
- Processing the work input
- Returning success/failure results

The queue managers in `@unchainedshop/core` handle allocation and retry scheduling. Plugins return a `WorkResult` with a `success` flag.

## Events

| Event | Description |
|-------|-------------|
| `WORK_ADDED` | Work item added to queue |
| `WORK_ALLOCATED` | Work allocated to worker |
| `WORK_FINISHED` | Work processing completed |
| `WORK_RESCHEDULED` | Work scheduled for another attempt |
| `WORK_DELETED` | Work item deleted |

`WORK_FINISHED` is emitted for both successful and failed work; inspect its `success` flag.

## License

EUPL-1.2
