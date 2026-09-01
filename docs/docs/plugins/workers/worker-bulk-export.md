---
sidebar_position: 33
title: Bulk Export Worker
sidebar_label: Bulk Export
description: Export shop entities as CSV files
---

# Bulk Export Worker

Exports shop entities as CSV files through the work queue. The generated files are uploaded as private files with signed download URLs that expire after one hour.

Not to be confused with the [Export Token Worker](./worker-export-token.md), which handles NFT/token export.

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` / `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { BulkExportPlugin } from '@unchainedshop/plugins/worker/bulk-export';

pluginRegistry.register(BulkExportPlugin);
```

## Usage

The payload's `type` selects the export handler; remaining fields are handler-specific and validated against the handler's schema:

```graphql
mutation ExportProducts {
  addWork(
    type: BULK_EXPORT
    input: {
      type: "PRODUCTS"
      exportProducts: true
      exportPrices: true
    }
  ) {
    _id
    status
  }
}
```

Built-in handlers: `PRODUCTS`, `ASSORTMENTS`, `FILTERS`, `USER`. Custom handlers can be added via the `bulkExporter.handlers` option of `startPlatform`.

Handlers receive a locale list for localized fields, built from every active language plus its valid language-country dialects (active languages × active countries).

The result contains one entry per generated CSV file with a signed `url` and an `expires` timestamp.

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.bulk-export` |
| Type | `BULK_EXPORT` |
| Max Parallel | 1 |
| Source | [worker/bulk-export](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/worker/bulk-export) |

## Related

- [Bulk Import Worker](./worker-bulk-import.md)
- [Worker System](../../extend/worker.md)
