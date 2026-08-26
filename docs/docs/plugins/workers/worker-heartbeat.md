---
sidebar_position: 41
title: Heartbeat Worker
sidebar_label: Heartbeat
description: Test worker to verify the worker system is functioning
---

# Heartbeat Worker

A simple test worker used to verify that the worker system is functioning correctly.

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` / `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { HeartbeatPlugin } from '@unchainedshop/plugins/worker/heartbeat';

pluginRegistry.register(HeartbeatPlugin);
```

## Purpose

The Heartbeat Worker is primarily used for:
- Testing that the worker queue is processing jobs
- Debugging worker system issues
- Health checks in monitoring systems
- Simulating work delays for testing

## Usage

Create a heartbeat work item:

```graphql
mutation TestWorker {
  addWork(
    type: HEARTBEAT
    input: {
      wait: 1000
      fails: false
    }
  ) {
    _id
    status
  }
}
```

Note: `wait` is milliseconds to wait before completing, `fails: true` simulates a failure.

## Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `wait` | Number | - | Milliseconds to wait before completing |
| `fails` | Boolean | `false` | If `true`, the work will fail instead of succeed |

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.heartbeat` |
| Type | `HEARTBEAT` |
| Max Parallel | 1 |
| Source | [worker/heartbeat](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/worker/heartbeat) |

## Related

- [Worker System](../../extend/worker.md)
- [Plugins Overview](./)
