---
sidebar_position: 42
title: Zombie Killer Worker
sidebar_label: Zombie Killer
description: Clean up orphaned database records and files
---

# Zombie Killer Worker

Cleans up orphaned database records and files that are no longer referenced by their parent entities.

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` / `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { ZombieKillerPlugin } from '@unchainedshop/plugins/worker/zombie-killer';

pluginRegistry.register(ZombieKillerPlugin);
```

## Purpose

The Zombie Killer Worker removes "zombie" data - records that have become orphaned due to deletions or data inconsistencies:

- **Filter texts** without parent filters
- **Assortment texts** without parent assortments
- **Assortment media** without parent assortments
- **Product texts** without parent products
- **Product variations** without parent products
- **Product media** without parent products
- **Unreferenced files** in product-media and assortment-media paths (in-progress uploads are skipped)
- **Old bulk import streams** older than a configurable age
- **Dead carts** whose owning user no longer exists

## Auto-Scheduling

Runs automatically every day at 02:00 (configured on registration, retries 0).

## Usage

Trigger a cleanup:

```graphql
mutation CleanupZombies {
  addWork(
    type: ZOMBIE_KILLER
    input: {
      bulkImportMaxAgeInDays: 5
    }
  ) {
    _id
    status
  }
}
```

Note: `bulkImportMaxAgeInDays` is optional and defaults to 5.

## Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `bulkImportMaxAgeInDays` | Number | `5` | Days after which bulk import streams are deleted |

## Result

The worker returns counts of deleted items:

```json
{
  "deletedFilterTextsCount": 0,
  "deletedAssortmentTextsCount": 0,
  "deletedAssortmentMediaCount": 0,
  "deletedProductTextsCount": 0,
  "deletedProductVariationsCount": 0,
  "deletedProductMediaCount": 0,
  "deletedFilesCount": 0,
  "deletedCartsCount": 0
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.zombie-killer` |
| Type | `ZOMBIE_KILLER` |
| Auto-Schedule | Daily at 02:00 |
| Retries | 0 |
| Source | [worker/zombie-killer](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/worker/zombie-killer) |

## Related

- [Bulk Import Worker](./worker-bulk-import.md)
- [File Storage Plugins](../files/)
- [Plugins Overview](./)
