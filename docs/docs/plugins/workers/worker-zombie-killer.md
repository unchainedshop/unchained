---
sidebar_position: 42
title: Zombie Killer Worker
sidebar_label: Zombie Killer
description: Clean up orphaned database records and files
---

# Zombie Killer Worker

Cleans up orphaned database records and files that are no longer referenced by their parent entities.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/worker/zombie-killer';
```

## Purpose

The Zombie Killer Worker removes "zombie" data - records that have become orphaned due to deletions or data inconsistencies:

- **Filter texts** without parent filters
- **Assortment texts** without parent assortments
- **Assortment media** without parent assortments
- **Product texts** without parent products
- **Product variations** without parent products
- **Product media** without parent products
- **Unreferenced files** in product-media and assortment-media paths
- **Old bulk import streams** older than a configurable age

## Usage

Trigger a cleanup:

```graphql
mutation CleanupZombies {
  createWork(
    type: "ZOMBIE_KILLER"
    input: {
      bulkImportMaxAgeInDays: 5  # Optional, defaults to 5
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
  "deletedFilesCount": 0
}
```

## Recommended Schedule

Consider running this worker periodically (e.g., weekly) to keep your database clean:

```typescript
import { WorkerDirector, schedule } from '@unchainedshop/core';

WorkerDirector.configureAutoscheduling({
  type: 'ZOMBIE_KILLER',
  schedule: schedule.parse.cron('0 3 * * 0'), // Every Sunday at 3 AM
  input: { bulkImportMaxAgeInDays: 7 },
});
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.zombie-killer` |
| Type | `ZOMBIE_KILLER` |
| Source | [worker/zombie-killer.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/worker/zombie-killer.ts) |

## Related

- [Bulk Import Worker](./worker-bulk-import.md)
- [File Storage Plugins](../files/)
- [Plugins Overview](./)
