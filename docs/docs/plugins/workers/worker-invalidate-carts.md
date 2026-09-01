---
sidebar_position: 53
title: Invalidate Carts Worker
sidebar_label: Invalidate Carts
description: Recalculate recently-touched open carts
---

# Invalidate Carts Worker

Recalculates all open carts that were updated within the last `maxAgeDays`, so prices, taxes, and discounts stay current. Carts are recalculated sequentially to avoid saturating the MongoDB connection pool.

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` / `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { InvalidateCartsPlugin } from '@unchainedshop/plugins/worker/invalidate-carts';

pluginRegistry.register(InvalidateCartsPlugin);
```

## Auto-Scheduling

Runs automatically on the 1st of every month at 00:00 (cron `0 0 1 * *`, retries 0), configured on registration. The cron is evaluated in the server's local timezone, so the year-boundary run lands at local midnight on January 1 — the moment new-year tax rates take effect. Keep the server's `TZ` set to the relevant tax jurisdiction.

## Usage

Trigger a recalculation manually:

```graphql
mutation InvalidateCarts {
  addWork(
    type: INVALIDATE_CARTS
    input: { maxAgeDays: 7 }
  ) {
    _id
    status
  }
}
```

## Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `maxAgeDays` | Number | `30` | Only carts updated within this many days are recalculated |

## Result

```json
{
  "scannedCartCount": 0,
  "recalculatedCartCount": 0
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.invalidate-carts` |
| Type | `INVALIDATE_CARTS` |
| Auto-Schedule | Monthly, 1st at 00:00 local time |
| Retries | 0 |
| Source | [worker/invalidate-carts](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/worker/invalidate-carts) |

## Related

- [GC Guests Worker](./worker-gc-guests.md)
- [Worker System](../../extend/worker.md)
