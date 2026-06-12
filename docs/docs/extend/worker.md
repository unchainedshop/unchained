---
sidebar_position: 11
sidebar_label: Work Queue
title: Work Queue
description: Add custom background workers
---

# Work Queue

Workers perform background tasks based on input and triggers — a cron job that runs on an interval, sending an email after an operation, syncing with an external system, and so on.

## Creating a worker

The recommended way is the [`registerWorker`](./plugin-factories.md#workers) factory. You pass the work `type` and a `process` callback; the factory builds and registers the worker plugin.

```typescript
import { registerWorker } from '@unchainedshop/core';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

registerWorker<{ wait?: number; fails?: boolean }, { wait?: number }>({
  type: 'HEARTBEAT',
  process: async (input) => {
    if (input?.wait) await wait(input.wait);
    if (input?.fails) throw new Error('heartbeat failed'); // a thrown error => { success: false }
    return input; // the resolved value => { success: true, result: input }
  },
});
```

| Option | Description |
|---|---|
| `type` | Work type — passed to `modules.worker.addWork({ type })` to enqueue this work. Keyed `shop.unchained.worker.<type>`. |
| `process(input, workId)` | The work logic. Return a result (→ `{ success: true, result }`); a thrown error becomes `{ success: false }`. |
| `external` | `true` if the work is processed outside the engine (default `false`). |
| `maxParallelAllocations` | Concurrency cap for this work type. |

> For full control (a custom `key`/`version`, or the raw `doWork(input, api, workId)` shape), build an `IWorkerAdapter` and register it via `pluginRegistry.register()` — see [Plugin System](../concepts/director-adapter-pattern.md#adapter-contracts).

## Scheduling recurring work

```typescript
import { WorkerDirector } from '@unchainedshop/core';

WorkerDirector.configureAutoscheduling({
  type: 'HEARTBEAT',
  schedule: '0 * * * *', // every hour (cron syntax)
  input: () => ({ wait: 1000 }),
});
```

## Adding work to the queue

Enqueue work via the worker module on the Unchained context:

```typescript
await unchainedAPI.modules.worker.addWork({
  type: 'HEARTBEAT',
  retries: 0,
  input: { wait: 1000 },
});
```

## Related

- [Plugin Factories](./plugin-factories.md#workers) — `registerWorker`
- [Plugin System](../concepts/director-adapter-pattern.md) — the plugin architecture
