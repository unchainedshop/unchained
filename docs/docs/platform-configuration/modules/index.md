---
sidebar_position: 0
title: Core Modules
sidebar_label: Overview
description: Overview of Unchained Engine core modules and configuration
---

# Core Modules

Unchained Engine is built around a modular architecture. Each core module handles a specific domain of e-commerce functionality.

## Module Overview

| Module | Package | Description |
|--------|---------|-------------|
| [Products](./products) | `core-products` | Product catalog management |
| [Orders](./orders) | `core-orders` | Order lifecycle and cart |
| [Users](./users) | `core-users` | User accounts and authentication |
| [Assortments](./assortments) | `core-assortments` | Category hierarchies |
| [Filters](./filters) | `core-filters` | Search and faceted filtering |
| [Payment](./payment) | `core-payment` | Payment providers |
| [Delivery](./delivery) | `core-delivery` | Delivery providers |
| [Warehousing](./warehousing) | `core-warehousing` | Inventory management |
| [Enrollments](./enrollments) | `core-enrollments` | Subscriptions |
| [Quotations](./quotations) | `core-quotations` | Quote requests |
| [Bookmarks](./bookmarks) | `core-bookmarks` | User favorites |
| [Files](./files) | `core-files` | Media management |
| [Worker](./worker) | `core-worker` | Background jobs |
| [Events](./events) | `core-events` | Event history |
| [Countries](./countries) | `core-countries` | Country configuration |
| [Currencies](./currencies) | `core-currencies` | Currency configuration |
| [Languages](./languages) | `core-languages` | Language configuration |

## Configuration

Configure module options when starting the platform:

```typescript
import { startPlatform } from '@unchainedshop/platform';

await startPlatform({
  options: {
    // Module-specific options
    orders: {
      ensureUserHasCart: true,
    },
    products: {
      slugify: (title) => title.toLowerCase().replace(/\s+/g, '-'),
    },
    users: {
      mergeUserCartsOnLogin: true,
    },
  },
});
```

## Accessing Modules

Modules are available through the `modules` context:

```typescript
// In GraphQL resolvers
const resolvers = {
  Query: {
    product: async (_, { productId }, { modules }) => {
      return modules.products.findProduct({ productId });
    },
  },
};

// In custom code after platform start
const { modules } = await startPlatform({ ... });

const products = await modules.products.findProducts({
  status: 'ACTIVE',
  limit: 10,
});
```

## Common Module Methods

Most modules follow a consistent pattern:

### Query Methods
```typescript
// Find single entity
modules.products.findProduct({ productId });

// Find multiple entities
modules.products.findProducts({ status: 'ACTIVE', limit: 10 });

// Count entities
modules.products.count({ status: 'ACTIVE' });

// Check existence
modules.products.productExists({ productId });
```

### Mutation Methods
```typescript
// Create
const productId = await modules.products.create({ type: 'SIMPLE' });

// Update
await modules.products.update(productId, { status: 'ACTIVE' });

// Delete (usually soft delete)
await modules.products.delete(productId);
```

## Events

Modules emit events for important operations. Subscribe to events for custom logic:

```typescript
import { emit, registerEvents } from '@unchainedshop/events';

// Register custom event handlers
registerEvents(['CUSTOM_EVENT']);

// Subscribe to events
events.on('PRODUCT_CREATE', async ({ payload }) => {
  console.log('Product created:', payload.productId);
});
```

Common event patterns:
- `{MODULE}_CREATE` - Entity created
- `{MODULE}_UPDATE` - Entity updated
- `{MODULE}_REMOVE` - Entity deleted

## Related

- [Architecture](../../concepts/architecture) - System architecture overview
- [Director/Adapter Pattern](../../concepts/director-adapter-pattern) - Plugin system
- [Extending GraphQL](../../extend/graphql) - Custom API extensions
