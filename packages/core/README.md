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
const updatedCart = await unchainedCore.services.orders.updateCalculation(orderId);

// Bulk import
const importer = unchainedCore.bulkImporter.createBulkImporter({});
await importer.prepare({
  entity: 'PRODUCT',
  operation: 'UPDATE',
  payload: { _id: productId, specification: { tags: ['featured'] } },
}, unchainedCore);
const importResult = await importer.execute();
```

## API Overview

### Initialization

| Export | Description |
|--------|-------------|
| `initCore` | Initialize the core with all modules and services |
| `getAllAdapters` | Get adapters registered with the core plugin directors |

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

Plugin directors provide extensibility through the Director/Adapter pattern. Each director manages a collection of adapters that implement specific behaviors.

| Director | Description |
|----------|-------------|
| `PaymentDirector` | Payment processing adapters |
| `DeliveryDirector` | Delivery/shipping adapters |
| `WarehousingDirector` | Inventory and stock adapters |
| `WorkerDirector` | Background job workers |
| `FilterDirector` | Product search and filtering |
| `EnrollmentDirector` | Subscription plan handling |
| `QuotationDirector` | Quote/RFQ processing |
| `ProductPricingDirector` | Product price calculations |
| `OrderPricingDirector` | Order total calculations |
| `DeliveryPricingDirector` | Delivery fee calculations |
| `PaymentPricingDirector` | Payment fee calculations |
| `ProductDiscountDirector` | Product-level discounts |
| `OrderDiscountDirector` | Order-level discounts |
| `MessagingDirector` | Email/notification templates |

## Director/Adapter Architecture

The Unchained Engine uses a Director/Adapter pattern for extensibility. Directors manage collections of adapters, and adapters implement specific behaviors.

### Base Classes

```typescript
import { BaseAdapter, BaseDirector } from '@unchainedshop/utils';
```

- **BaseDirector**: Factory function that creates a generic director with methods to register, unregister, and retrieve adapters
- **BaseAdapter**: Base implementation providing logging and utility methods for all adapters

### Creating a Custom Adapter

Start with the base adapter for the relevant director. Spread its defaults, then override the methods your integration implements. Adapter objects provide `key`, `label`, and `version`; directors register them by key.

```typescript
import { WorkerAdapter, WorkerDirector, schedule, type IWorkerAdapter } from '@unchainedshop/core';

interface MyInput { message: string; }
interface MyOutput { processed: boolean; }

const MyWorker: IWorkerAdapter<MyInput, MyOutput> = {
  ...WorkerAdapter,
  key: 'my-worker',
  label: 'My Background Worker',
  version: '1.0.0',
  type: 'MY_WORK_TYPE',
  maxParallelAllocations: 10,

  async doWork(input) {
    console.log(input.message);
    return { success: true, result: { processed: true } };
  },
};

WorkerDirector.registerAdapter(MyWorker);
WorkerDirector.configureAutoscheduling({
  type: 'MY_WORK_TYPE',
  input: async () => ({ message: 'Scheduled work' }),
  schedule: schedule.parse.cron('0 * * * *'),
});
```

For complete contracts and implementations, see the [director and adapter sources](src/directors) and [official plugins](../plugins/README.md). Payment and delivery adapters receive `(configuration, context)` in `actions`; pricing, discount, filter, quotation, and enrollment adapters each have their own contracts. Their base adapters supply the required defaults.

### Messaging Templates

`MessagingDirector.registerTemplate` registers a resolver that returns worker inputs. The platform passes message data such as `orderId` and `locale`; the resolver can load records through the supplied API.

```typescript
import { MessagingDirector } from '@unchainedshop/core';

MessagingDirector.registerTemplate('CUSTOM_NOTIFICATION', async ({ recipient }) => [
  {
    type: 'EMAIL',
    input: {
      to: recipient,
      subject: 'Notification',
      text: 'Your update is ready.',
    },
  },
]);
```

An `EMAIL` worker adapter must be registered to deliver these messages.

### Bulk Importer

| Method | Description |
|--------|-------------|
| `bulkImporter.createBulkImporter` | Create a batch importer with options |
| `importer.validate` | Validate an import event |
| `importer.prepare` | Prepare an event with the core API |
| `importer.execute` | Execute the prepared database operations |
| `bulkImporter.validateEventStream` | Validate a JSON event stream |
| `bulkImporter.pipeEventStream` | Prepare events from a JSON stream |

### Types

| Export | Description |
|--------|-------------|
| `UnchainedCore` | Core instance type |
| `UnchainedCoreOptions` | Initialization options |
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
