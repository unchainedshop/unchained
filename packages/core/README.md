[![npm version](https://img.shields.io/npm/v/@unchainedshop/core.svg)](https://npmjs.com/package/@unchainedshop/core)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core

Core orchestration for the Unchained Engine: domain modules, cross-module services, plugin directors, and bulk import/export.

## Installation

```bash
npm install @unchainedshop/core
```

## Usage

Most applications initialize core through `startPlatform()` from `@unchainedshop/platform`. Infrastructure integrations can initialize it directly with an existing database and migration repository:

```typescript
import { initCore } from '@unchainedshop/core';

const core = await initCore({ db, migrationRepository });
const products = await core.modules.products.findProducts({});
```

`initCore()` accepts `options` for built-in modules, `modules` containing custom `{ configure }` factories, `services` for custom services, and `bulkImporter`/`bulkExporter` handler configuration. Built-in modules are included automatically. Platform startup additionally initializes plugin modules and lifecycle hooks, accounts, templates, HTTP API, and workers.

## Modules and services

`core.modules` exposes `products`, `assortments`, `filters`, `orders`, `users`, `payment`, `delivery`, `warehousing`, `enrollments`, `quotations`, `bookmarks`, `countries`, `currencies`, `languages`, `files`, `events`, and `worker`.

`core.services` coordinates operations across modules, including pricing, checkout, payment, delivery, filtering, files, and enrollment processing. See [module configuration](src/modules.ts) and [service composition](src/services/index.ts) for their current interfaces.

## Plugin registration

Register built-in plugins explicitly before platform startup. Importing a plugin has no registration side effect:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { StripePlugin } from '@unchainedshop/plugins/payment/stripe';

pluginRegistry.register(StripePlugin);
```

Alternatively, call `registerBasePlugins()`, `registerAllPlugins()`, or `registerCryptoPlugins()` from the corresponding `@unchainedshop/plugins/presets/base`, `/all`, or `/crypto` subpath. Package subpaths have no file extension.

Directors resolve adapters from `pluginRegistry` by the `adapterType` symbol provided by each domain's base adapter. `getAllAdapters()` lists adapters across the core directors.

### Custom adapters

The typed `registerX()` factories both create and register an `IPlugin`. Call them before platform startup:

```typescript
import {
  registerPaymentProvider,
  registerDeliveryProvider,
  registerPhysicalWarehousing,
  registerProductPricing,
} from '@unchainedshop/core';

registerPaymentProvider({
  adapterId: 'manual-payment',
  isPayLaterAllowed: true,
  charge: false,
});

registerDeliveryProvider({
  adapterId: 'manual-shipping',
  autoReleaseAllowed: false,
  send: true,
});

registerPhysicalWarehousing({
  adapterId: 'local-stock',
  stock: 100,
  commissioningTime: 24 * 60 * 60 * 1000,
});

registerProductPricing({
  adapterId: 'fixed-price',
  orderIndex: 0,
  calculate: async (sheet) => {
    sheet.addItem({ amount: 1000, isTaxable: true, isNetPrice: false });
  },
});
```

The pricing example supplies a fixed base price in the smallest currency unit. Choose the pricing adapters appropriate to your shop so multiple adapters do not unintentionally add base prices.

| Concern | Factories |
|---------|-----------|
| Payment | `registerPaymentProvider`, `registerInvoicePayment` |
| Delivery | `registerDeliveryProvider`, `registerShippingDelivery`, `registerPickUpDelivery` |
| Warehousing | `registerPhysicalWarehousing`, `registerVirtualWarehousing` |
| Pricing | `registerProductPricing`, `registerOrderPricing`, `registerPaymentPricing`, `registerDeliveryPricing` |
| Discounts | `registerProductDiscount`, `registerOrderDiscount` |
| Filtering | `registerProductDiscoverabilityFilter`, `registerProductSearchFilter`, `registerAssortmentSearchFilter` |
| Files | `registerFileAdapter` |
| Quotations | `registerQuotation` |
| Enrollments | `registerEnrollment` |
| Workers | `registerWorker` |

See the [factory implementations](src/factory/index.ts) for typed callback signatures. For capabilities beyond the factories, spread the relevant domain base adapter (for example `PaymentAdapter`) and its `actions()` defaults, then put the adapter in an `IPlugin` and call `pluginRegistry.register(plugin)`. This preserves the adapter's type symbol and required default methods.

### Workers and recurring schedules

```typescript
import { registerWorker, schedule, WorkerDirector } from '@unchainedshop/core';

registerWorker<{ message: string }, { logged: boolean }>({
  type: 'LOG_MESSAGE',
  maxParallelAllocations: 1,
  process: async ({ message }) => {
    console.log(message);
    return { logged: true };
  },
});

WorkerDirector.configureAutoscheduling({
  type: 'LOG_MESSAGE',
  input: async () => ({ message: 'Hourly check' }),
  schedule: schedule.parse.cron('0 * * * *'),
});
```

Autoscheduling accepts parsed `ScheduleData` and an asynchronous input factory. The platform's queue managers enqueue and execute the scheduled work.

### Messaging templates

Messaging uses template resolvers registered separately from adapters:

```typescript
import { MessagingDirector } from '@unchainedshop/core';

MessagingDirector.registerTemplate('CUSTOM_NOTICE', async ({ email }) => [
  {
    type: 'EMAIL',
    input: {
      from: 'shop@example.com',
      to: email,
      subject: 'Shop notice',
      text: 'Your requested notification.',
    },
  },
]);
```

Each returned item is work for its registered worker type, such as `EMAIL` or `TWILIO`. Template parameters depend on the caller; they are not automatically populated with order/user documents.

## Bulk import and export

`core.bulkImporter.createBulkImporter(options)` creates an import session with `validate(event)`, `prepare(event, core)`, `execute()`, and `invalidateCaches(core)`. Events carry `entity`, `operation`, and `payload`; the built-in entities are `PRODUCT`, `ASSORTMENT`, and `FILTER`.

For streams, use `validateEventStream(readStream)` and `pipeEventStream(readStream, importer, core)`, then execute the import and invalidate caches. See the [importer](src/bulk-importer/createBulkImporter.ts) and [exporter](src/bulk-exporter/index.ts) for the full interfaces.

## Types

The package exports `UnchainedCore`, `UnchainedCoreOptions`, `Services`, `BulkImporter`, `BulkExporter`, and `IPlugin`, along with domain adapter/context and pricing sheet types. Access the composed module type through `UnchainedCore['modules']`.

## License

EUPL-1.2
