---
sidebar_position: 31
title: Bulk Import Worker
sidebar_label: Bulk Import
description: Process large data imports from JSON streams
---

# Bulk Import Worker

Processes large data imports from JSON streams with event-based processing.

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` / `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { BulkImportPlugin } from '@unchainedshop/plugins/worker/bulk-import';

pluginRegistry.register(BulkImportPlugin);
```

## Event Format

Each event has an `entity` (`PRODUCT`, `ASSORTMENT`, or `FILTER`), an `operation` (`CREATE`, `UPDATE`, `REMOVE`), and a `payload`. See the [Bulk Import Guide](../../guides/bulk-import.md) for the full event schemas.

```json
{
  "events": [
    {
      "entity": "PRODUCT",
      "operation": "CREATE",
      "payload": {
        "_id": "product-001",
        "specification": { "type": "SIMPLE_PRODUCT" }
      }
    }
  ]
}
```

Only one `BULK_IMPORT` work item is processed at a time (`maxParallelAllocations: 1`).

## Triggering Import

### From Uploaded File

```graphql
mutation CreateBulkImportWork {
  addWork(
    type: BULK_IMPORT
    input: {
      payloadId: "uploaded-file-id"
      createShouldUpsertIfIDExists: false
      updateShouldUpsertIfIDNotExists: false
      skipCacheInvalidation: false
    }
  ) {
    _id
    status
  }
}
```

### From Direct Events

```typescript
// Direct events must be passed programmatically
await unchainedAPI.modules.worker.addWork({
  type: 'BULK_IMPORT',
  input: {
    events: [
      { entity: 'PRODUCT', operation: 'CREATE', payload: { _id: 'product-001' } }
    ]
  }
});
```

## Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `payloadId` | String | - | File ID of uploaded JSON stream |
| `events` | Array | - | Direct array of import events (alternative to payloadId) |
| `createShouldUpsertIfIDExists` | Boolean | `false` | Upsert on CREATE if ID already exists |
| `updateShouldUpsertIfIDNotExists` | Boolean | `false` | Upsert on UPDATE if ID doesn't exist |
| `skipCacheInvalidation` | Boolean | `false` | Skip cache invalidation after import |

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.bulk-import` |
| Type | `BULK_IMPORT` |
| Max Parallel | 1 |
| Source | [worker/bulk-import](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/worker/bulk-import) |

## Related

- [Bulk Import Guide](../../guides/bulk-import.md)
- [File Storage Plugins](../files/file-minio.md)
- [Plugins Overview](./)
