[![npm version](https://img.shields.io/npm/v/@unchainedshop/core.svg)](https://npmjs.com/package/@unchainedshop/core)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core

Core orchestration package for the Unchained Engine. Integrates all core-* modules, provides business services, directors for plugins, and bulk import functionality.

## Installation

```bash
npm install @unchainedshop/core
```

## Usage

```typescript
import { initCore, type UnchainedCore } from '@unchainedshop/core';

const unchainedCore = await initCore({
  db,
  migrationRepository,
  options: {
    // Module-specific options
  },
});

// Access modules
const products = await unchainedCore.modules.products.findProducts({});

// Use services
const pricing = await unchainedCore.services.orders.pricingSheet(order);

// Bulk import
await unchainedCore.bulkImporter.prepare('PRODUCT');
```

## API Overview

### Initialization

| Export | Description |
|--------|-------------|
| `initCore` | Initialize the core with all modules and services |
| `getAllAdapters` | Get all registered adapters across all directors |

### Modules

The `modules` object provides access to all core-* module APIs:

| Module | Description |
|--------|-------------|
| `products` | Product management |
| `assortments` | Category/assortment management |
| `filters` | Product filtering and search |
| `orders` | Order management |
| `users` | User management |
| `payment` | Payment providers |
| `delivery` | Delivery providers |
| `warehousing` | Inventory and stock |
| `enrollments` | Subscriptions |
| `quotations` | Quote management |
| `bookmarks` | User bookmarks |
| `countries` | Country management |
| `currencies` | Currency management |
| `languages` | Language management |
| `files` | File management |
| `events` | Event history |
| `worker` | Background jobs |

### Services

Business logic services that orchestrate multiple modules:

| Service | Description |
|---------|-------------|
| `orders` | Order pricing, checkout workflows |
| `products` | Product pricing calculations |
| `users` | User-related operations |
| `files` | File operations with adapters |

### Directors

Plugin directors for extensibility:

| Director | Description |
|----------|-------------|
| `WorkerDirector` | Background job workers |
| `DeliveryDirector` | Delivery adapters |
| `DeliveryPricingDirector` | Delivery pricing |
| `EnrollmentDirector` | Subscription handling |
| `FilterDirector` | Search filter adapters |
| `OrderDiscountDirector` | Order discount calculations |
| `OrderPricingDirector` | Order pricing |
| `PaymentDirector` | Payment adapters |
| `PaymentPricingDirector` | Payment pricing |
| `ProductDiscountDirector` | Product discounts |
| `ProductPricingDirector` | Product pricing |
| `QuotationDirector` | Quotation handling |
| `WarehousingDirector` | Inventory adapters |
| `MessagingDirector` | Email/notification templates |

### Bulk Importer

| Method | Description |
|--------|-------------|
| `bulkImporter.prepare` | Prepare bulk import for entity type |
| `bulkImporter.process` | Process prepared import data |

### Types

| Export | Description |
|--------|-------------|
| `UnchainedCore` | Core instance type |
| `UnchainedCoreOptions` | Initialization options |
| `Modules` | All modules type |
| `Services` | All services type |
| `BulkImporter` | Bulk importer type |

## Configuration

```typescript
const core = await initCore({
  db,
  migrationRepository,
  modules: {
    // Custom modules
  },
  services: {
    // Custom services
  },
  bulkImporter: {
    handlers: {
      // Custom import handlers
    },
  },
  options: {
    // Module-specific options
  },
});
```

## License

EUPL-1.2
