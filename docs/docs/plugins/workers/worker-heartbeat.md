---
sidebar_position: 41
title: Heartbeat Worker
sidebar_label: Heartbeat
description: Test worker to verify the worker system is functioning
---

# Heartbeat Worker

A simple test worker used to verify that the worker system is functioning correctly.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/worker/heartbeat';
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
  createWork(
    type: "HEARTBEAT"
    input: {
      wait: 1000,   # Optional: milliseconds to wait before completing
      fails: false  # Optional: set to true to simulate a failure
    }
  ) {
    _id
    status
  }
}
```

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
| Source | [worker/heartbeat.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/worker/heartbeat.ts) |

## Related

- [Worker System](../../extend/worker.md)
- [Plugins Overview](./)
