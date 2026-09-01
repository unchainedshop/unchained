---
sidebar_position: 52
title: GC Guests Worker
sidebar_label: GC Guests
description: Garbage-collect stale guest users
---

# GC Guests Worker

Deletes stale guest users. A guest is considered stale when both its `created` date and its last activity signal (`lastLogin.timestamp`, bumped on login and by the `heartbeat` mutation) are older than the cutoff. Deleting a guest cascade-deletes its open carts.

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` / `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { GCGuestsPlugin } from '@unchainedshop/plugins/worker/gc-guests';

pluginRegistry.register(GCGuestsPlugin);
```

## Auto-Scheduling

Runs automatically every day at 02:30 (cron `30 2 * * *`, retries 0), configured on registration.

## Usage

Trigger a run manually:

```graphql
mutation CollectGuests {
  addWork(
    type: GC_GUESTS
    input: { guestUserMaxAgeInDays: 14 }
  ) {
    _id
    status
  }
}
```

## Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `guestUserMaxAgeInDays` | Number | users module setting `guestUserMaxAgeInDays` (default `30`, overridable via `UNCHAINED_GUEST_USER_EXPIRY_DAYS`) | Guests without activity for this many days are deleted |

## Result

```json
{
  "scannedGuestCount": 0,
  "deletedGuestCount": 0
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.gc-guests` |
| Type | `GC_GUESTS` |
| Auto-Schedule | Daily at 02:30 |
| Retries | 0 |
| Source | [worker/gc-guests](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/worker/gc-guests) |

## Related

- [Invalidate Carts Worker](./worker-invalidate-carts.md)
- [Zombie Killer Worker](./worker-zombie-killer.md)
