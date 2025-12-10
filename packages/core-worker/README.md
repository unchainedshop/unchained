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

const workerModule = await configureWorkerModule({ db });

// Add a work item to the queue
const workId = await workerModule.addWork({
  type: 'SEND_EMAIL',
  input: {
    to: 'user@example.com',
    template: 'order-confirmation',
  },
});

// Find pending work
const pendingWork = await workerModule.findWork({
  status: WorkStatus.NEW,
});

// Process work (typically done by worker plugins)
await workerModule.processWork(workId, {
  success: true,
  result: { messageId: 'abc123' },
});
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
| `processWork` | Mark work as processed |
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
| `SEND_EMAIL` | Send email notifications |
| `HEARTBEAT` | Keep-alive jobs |
| `EXTERNAL` | External service calls |

## Worker Plugins

Workers process jobs by type. The plugin is responsible for:
- Handling retries on failure
- Processing the work input
- Returning success/failure results

## Events

| Event | Description |
|-------|-------------|
| `WORK_ADDED` | Work item added to queue |
| `WORK_ALLOCATED` | Work allocated to worker |
| `WORK_FINISHED` | Work processing completed |
| `WORK_FAILED` | Work processing failed |

## License

EUPL-1.2
