---
sidebar_position: 31
title: Bulk Import Worker
sidebar_label: Bulk Import
description: Process large data imports from JSON streams
---

# Bulk Import Worker

Processes large data imports from JSON streams with event-based processing.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/worker/bulk-import';
```

## Features

- **Streaming Processing**: Handles large files without memory issues
- **JSON Stream Parsing**: Parses JSON events from uploaded files
- **Event-Based**: Processes import events one by one
- **File Adapter Integration**: Works with any Unchained file storage adapter
- **Backpressure Handling**: Automatic flow control for large datasets

## Usage

Upload a JSON file with import events:

```json
{
  "events": [
    {
      "type": "PRODUCT",
      "operation": "CREATE",
      "payload": {
        "sku": "PRODUCT-001",
        "title": "Sample Product"
      }
    },
    {
      "type": "PRODUCT",
      "operation": "UPDATE",
      "payload": {
        "sku": "PRODUCT-002",
        "title": "Updated Product"
      }
    }
  ]
}
```

## Supported Event Types

- `PRODUCT` - Create/update products
- `ASSORTMENT` - Create/update assortments
- `FILTER` - Create/update filters
- `ENROLLMENT` - Create/update enrollments

## Triggering Import

### From Uploaded File

```graphql
mutation CreateBulkImportWork {
  createWork(
    type: "BULK_IMPORT"
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

```graphql
mutation CreateBulkImportWork {
  createWork(
    type: "BULK_IMPORT"
    input: {
      events: [
        { "type": "PRODUCT", "operation": "CREATE", "payload": { "sku": "PRODUCT-001" } }
      ]
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
| `payloadId` | String | - | File ID of uploaded JSON stream |
| `events` | Array | - | Direct array of import events (alternative to payloadId) |
| `createShouldUpsertIfIDExists` | Boolean | `false` | Upsert on CREATE if ID already exists |
| `updateShouldUpsertIfIDNotExists` | Boolean | `false` | Upsert on UPDATE if ID doesn't exist |
| `skipCacheInvalidation` | Boolean | `false` | Skip cache invalidation after import |

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.bulk-import` |
| Source | [worker/bulk-import.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/worker/bulk-import.ts) |

## Related

- [Bulk Import Guide](../../guides/bulk-import.md)
- [File Storage Plugins](../files/file-minio.md)
- [Plugins Overview](./)
