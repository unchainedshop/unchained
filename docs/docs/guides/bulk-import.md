---
sidebar_position: 8
title: Bulk Import
sidebar_label: Bulk Import
description: Import large amounts of data from PIM/ERP systems
---

# Bulk Import

This guide covers importing large datasets from external systems like PIM (Product Information Management) or ERP (Enterprise Resource Planning) into Unchained Engine.

## Overview

The Bulk Import API is designed for high-volume data synchronization:

```mermaid
flowchart LR
    PIM[PIM/ERP System] --> BI[Bulk Import<br/>Work Queue] --> DB[(Unchained DB<br/>MongoDB)]
```

### Key Features

- **Cloud Native**: Background processing on dedicated worker instances
- **Transparent Process**: Results stored on work items for queryable success/failure
- **Error Reporting**: Sync issues reported via email to a central address
- **Performance**: MongoDB bulk operations and intelligent asset caching
- **Push-Based**: Immediate representation of changes

## Import Methods

### GraphQL Method

For smaller imports, use the GraphQL mutation:

```graphql
mutation BulkImport {
  addWork(
    type: BULK_IMPORT
    input: {
      events: [
        {
          entity: "PRODUCT"
          operation: "CREATE"
          payload: {
            _id: "product-1"
            specification: {
              type: "SIMPLE_PRODUCT"
              content: { en: { title: "Product 1" } }
            }
          }
        }
      ]
    }
  ) {
    _id
    status
  }
}
```

### REST Endpoint

For large imports (5K+ entities or >16MB), use the REST endpoint:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @products.json \
  https://your-engine.com/bulk-import
```

## Event Structure

Every event consists of three parts:

```json
{
  "entity": "ENTITY_TYPE",
  "operation": "OPERATION_TYPE",
  "payload": { ... }
}
```

### Supported Entities

| Entity | Description |
|--------|-------------|
| `PRODUCT` | Products (simple, configurable, bundle, plan) |
| `ASSORTMENT` | Categories and collections |
| `FILTER` | Product filters and facets |

### Supported Operations

| Operation | Description |
|-----------|-------------|
| `CREATE` | Create new entity |
| `UPDATE` | Update existing entity |
| `REMOVE` | Delete entity |

## Import Options

Pass options as query parameters (REST) or in the input object (GraphQL):

| Option | Description |
|--------|-------------|
| `createShouldUpsertIfIDExists` | CREATE updates if entity exists |
| `updateShouldUpsertIfIDNotExists` | UPDATE creates if entity missing |
| `skipCacheInvalidation` | Skip filter/assortment cache updates |

```bash
# REST with options
curl -X POST \
  "https://your-engine.com/bulk-import?createShouldUpsertIfIDExists=true" \
  --data-binary @products.json
```

## Product Import

```json
{
  "entity": "PRODUCT",
  "operation": "CREATE",
  "payload": {
    "_id": "configurable-product",
    "specification": {
      "type": "CONFIGURABLE_PRODUCT",
      "published": "2024-01-01T00:00:00Z",
      "variationResolvers": [
        {
          "vector": { "color": "red", "size": "M" },
          "productId": "variant-red-m"
        },
        {
          "vector": { "color": "blue", "size": "M" },
          "productId": "variant-blue-m"
        }
      ],
      "content": {
        "en": {
          "title": "Configurable T-Shirt",
          "slug": "configurable-t-shirt"
        }
      }
    },
    "variations": [
      {
        "key": "color",
        "type": "COLOR",
        "options": [
          {
            "value": "red",
            "content": {
              "en": { "title": "Red" }
            }
          },
          {
            "value": "blue",
            "content": {
              "en": { "title": "Blue" }
            }
          }
        ],
        "content": {
          "en": { "title": "Color" }
        }
      },
      {
        "key": "size",
        "type": "TEXT",
        "options": [
          {
            "value": "M",
            "content": {
              "en": { "title": "Medium" }
            }
          }
        ],
        "content": {
          "en": { "title": "Size" }
        }
      }
    ]
  }
}
```

`published` accepts an ISO date string or, for in-process imports, a `Date`; `null` leaves the product unpublished.

### Tokenized Products

`specification.tokenization` configures tokenized products, for example an event ticket for the [ticket issuer](./ticketing-setup.md#the-ticket-issuer). All fields are optional; off-chain tickets need no `contractAddress` or `tokenId`. `ercMetadataProperties` is public (it is served as token metadata). The ticketing plugin reads the event details from `specification.meta`:

```json
{
  "entity": "PRODUCT",
  "operation": "CREATE",
  "payload": {
    "_id": "concert-2026-10-01",
    "specification": {
      "type": "TOKENIZED_PRODUCT",
      "status": "ACTIVE",
      "published": "2026-09-01T00:00:00Z",
      "tags": ["concert"],
      "commerce": {
        "pricing": [{ "amount": 4500, "currencyCode": "CHF", "countryCode": "CH" }]
      },
      "tokenization": {
        "contractStandard": "ERC721",
        "supply": 300
      },
      "meta": {
        "slot": "2026-10-01T18:00:00Z",
        "location": "Main Hall",
        "durationMinutes": 120,
        "doorsOpenMinutesBefore": 30,
        "category": "Concert"
      },
      "content": {
        "en": { "title": "Autumn Concert", "slug": "autumn-concert" }
      }
    }
  }
}
```

An `UPDATE` with `tokenization` or `meta` replaces the stored object as a whole (without it, the stored one is kept). For ticket events, `meta` holds the event details and the cancellation (`meta.cancelled`, set by `cancelEvent`): a sync that sends `meta` owns the event details and un-cancels the event, so leave `meta` out and use `updateTicketEvent`, or carry `cancelled` / `cancelledDate` over.

A ticket production (several dates and ticket categories, see [Productions](./ticketing-setup.md#productions)) is a `CONFIGURABLE_PRODUCT` tagged `ticket-production` with `meta` (`location`, `durationMinutes`, `doorsOpenMinutesBefore`, `saleRules`, `ticketCategories`), the variations `slot` (start as ISO string) and `category` (category code) and `variationResolvers` pointing to one tokenized product per start and category. Import the dates first, then the production, and run `syncTicketProduction` so the dates take texts, tags, details and images over; creating and editing productions in the Admin UI needs no import.

## Assortment Import

### Create Category Hierarchy

```json
{
  "entity": "ASSORTMENT",
  "operation": "CREATE",
  "payload": {
    "_id": "root-category",
    "specification": {
      "isActive": true,
      "isRoot": true,
      "tags": ["main-nav"],
      "content": {
        "en": {
          "title": "All Products",
          "slug": "all-products",
          "description": "Browse all products"
        }
      }
    },
    "children": [
      {
        "assortmentId": "electronics",
        "tags": []
      },
      {
        "assortmentId": "clothing",
        "tags": []
      }
    ],
    "products": [
      {
        "productId": "featured-product",
        "tags": ["featured"]
      }
    ],
    "filters": [
      {
        "filterId": "brand-filter"
      }
    ],
    "media": [
      {
        "asset": {
          "url": "https://example.com/category-banner.jpg"
        },
        "tags": ["banner"],
        "content": {
          "en": {
            "title": "Category Banner"
          }
        }
      }
    ]
  }
}
```

## Filter Import

### Create Product Filter

```json
{
  "entity": "FILTER",
  "operation": "CREATE",
  "payload": {
    "_id": "brand-filter",
    "specification": {
      "key": "brand",
      "isActive": true,
      "type": "SINGLE_CHOICE",
      "options": [
        {
          "value": "nike",
          "content": {
            "en": { "title": "Nike" },
            "de": { "title": "Nike" }
          }
        },
        {
          "value": "adidas",
          "content": {
            "en": { "title": "Adidas" },
            "de": { "title": "Adidas" }
          }
        }
      ],
      "content": {
        "en": {
          "title": "Brand",
          "subtitle": "Filter by brand"
        }
      }
    }
  }
}
```

### Filter Types

| Type | Description |
|------|-------------|
| `SINGLE_CHOICE` | Select one option |
| `MULTI_CHOICE` | Select multiple options |
| `RANGE` | Numeric range (price, weight) |
| `SWITCH` | Boolean toggle |

## Custom Import Handlers

Create custom handlers for specialized import needs. Entity keys must be uppercase and operation keys lowercase — the engine uppercases `entity` and lowercases `operation` from each event before looking up the handler:

```typescript
import { startPlatform } from '@unchainedshop/platform';
import type { UnchainedCore, BulkImportHandler } from '@unchainedshop/core';

const customHandlers: Record<string, BulkImportHandler<UnchainedCore>> = {
  INVENTORY: {
    update: async function updateInventory(
      payload: { sku: string; quantity: number },
      options,
      unchainedAPI: UnchainedCore,
    ) {
      const { sku, quantity } = payload;

      // Your import logic, e.g. write to a custom module
      await unchainedAPI.modules.myInventory.updateStock(sku, quantity);

      return {
        entity: 'INVENTORY',
        operation: 'update',
        success: true,
      };
    },
  },
};

// Register handlers
await startPlatform({
  bulkImporter: {
    handlers: customHandlers,
  },
});
```

### Usage

```json
{
  "entity": "INVENTORY",
  "operation": "UPDATE",
  "payload": {
    "sku": "SKU-123",
    "quantity": 50
  }
}
```

## Best Practices

### 1. Batch Events

Send multiple events in a single request:

```json
{
  "events": [
    { "entity": "PRODUCT", "operation": "CREATE", "payload": { ... } },
    { "entity": "PRODUCT", "operation": "CREATE", "payload": { ... } },
    { "entity": "PRODUCT", "operation": "CREATE", "payload": { ... } }
  ]
}
```

### 2. Use REST for Large Imports

Switch to REST endpoint when:
- More than 5,000 entities
- JSON payload exceeds 16MB

### 3. Order Dependencies

Import in the correct order:
1. Filters (referenced by assortments)
2. Products (referenced by assortments)
3. Assortments (may reference filters and products)

### 4. Idempotent Imports

Use `createShouldUpsertIfIDExists` for safe re-runs:

```bash
curl -X POST \
  "https://your-engine.com/bulk-import?createShouldUpsertIfIDExists=true" \
  --data-binary @products.json
```

### 5. Skip Cache for Availability Updates

For inventory-only updates, skip cache invalidation:

```bash
curl -X POST \
  "https://your-engine.com/bulk-import?skipCacheInvalidation=true" \
  --data-binary @inventory.json
```

## Monitoring Imports

### Query Import Status

```graphql
query ImportJobs {
  workQueue(types: [BULK_IMPORT], limit: 10) {
    _id
    type
    status
    started
    finished
    result
    error
  }
}
```

### Import Statuses

| Status | Description |
|--------|-------------|
| `NEW` | Queued for processing |
| `ALLOCATED` | Being processed |
| `SUCCESS` | Completed successfully |
| `FAILED` | Failed with error |

## Sync Service Example

For systems requiring pull-based sync:

```typescript
import { registerWorker, WorkerDirector, schedule } from '@unchainedshop/core';

registerWorker<{ lastSyncDate?: string }, { synced: number }>({
  type: 'PIM_SYNC',
  maxParallelAllocations: 1,
  process: async (input) => {
    const { lastSyncDate } = input;

    const products = await fetchPIMProducts({ since: lastSyncDate });
    const events = products.map((product) => ({
      entity: 'PRODUCT',
      operation: 'UPDATE',
      payload: transformProduct(product),
    }));

    await submitBulkImport(events); // e.g. POST the events to /bulk-import
    return { synced: events.length };
  },
});

// Schedule hourly sync
WorkerDirector.configureAutoscheduling({
  type: 'PIM_SYNC',
  schedule: schedule.parse.cron('0 * * * *'),
});
```

## Related

- [Custom Modules](../extend/custom-modules) - Create custom modules for sync logic
- [Worker Module](../platform-configuration/modules/worker) - Background job processing
- [Events](../extend/events/) - React to import events
