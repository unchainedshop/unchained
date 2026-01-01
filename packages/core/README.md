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
import { createDrizzleDb } from '@unchainedshop/store';

// Create database connection
const { db: drizzleDb } = createDrizzleDb({
  url: process.env.DRIZZLE_DB_URL || 'file:unchained.db',
  authToken: process.env.DRIZZLE_DB_TOKEN,
});

const unchainedCore = await initCore({
  drizzleDb,
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

All adapters extend from `BaseAdapter` and must implement:

```typescript
const MyAdapter = {
  key: 'my-adapter',           // Unique identifier
  label: 'My Custom Adapter',  // Human-readable label
  version: '1.0.0',            // Adapter version

  // Adapter-specific methods...
};

// Register with the appropriate director
SomeDirector.registerAdapter(MyAdapter);
```

### Payment Director

Manages payment processing and orchestrates payment adapters.

```typescript
import { PaymentDirector, type IPaymentAdapter } from '@unchainedshop/core';

const MyPaymentAdapter: IPaymentAdapter = {
  key: 'my-payment',
  label: 'My Payment Gateway',
  version: '1.0.0',

  typeSupported(type) {
    return type === 'CARD';
  },

  actions(config, context) {
    return {
      configurationError() { return null; },
      isActive() { return true; },
      isPayLaterAllowed() { return false; },

      async charge() {
        // Process payment charge
        return { transactionId: '...' };
      },
      async confirm() {
        // Confirm payment
        return { transactionId: '...' };
      },
      async cancel() {
        // Cancel payment
        return true;
      },
      async register() {
        // Register payment method
        return { token: '...' };
      },
      async sign() {
        // Sign payment request
        return '...';
      },
      async validate(token) {
        // Validate payment token
        return true;
      },
    };
  },
};

PaymentDirector.registerAdapter(MyPaymentAdapter);
```

### Delivery Director

Manages delivery operations and coordinates shipping adapters.

```typescript
import { DeliveryDirector, type IDeliveryAdapter } from '@unchainedshop/core';

const MyDeliveryAdapter: IDeliveryAdapter = {
  key: 'my-delivery',
  label: 'My Shipping Provider',
  version: '1.0.0',

  typeSupported(type) {
    return type === 'SHIPPING';
  },

  actions(config, context) {
    return {
      configurationError() { return null; },
      isActive() { return true; },
      isAutoReleaseAllowed() { return false; },

      async send() {
        // Trigger delivery
        return { trackingNumber: '...' };
      },
      estimatedDeliveryThroughput(warehousingTime) {
        // Return estimated delivery time in ms
        return 3 * 24 * 60 * 60 * 1000; // 3 days
      },
      async pickUpLocations() {
        // Return available pickup locations
        return [];
      },
      async pickUpLocationById(locationId) {
        return null;
      },
    };
  },
};

DeliveryDirector.registerAdapter(MyDeliveryAdapter);
```

### Warehousing Director

Manages inventory and stock operations, including NFT/token support.

```typescript
import { WarehousingDirector, type IWarehousingAdapter } from '@unchainedshop/core';

const MyWarehousingAdapter: IWarehousingAdapter = {
  key: 'my-warehouse',
  label: 'My Inventory System',
  version: '1.0.0',

  typeSupported(type) {
    return type === 'PHYSICAL';
  },

  actions(config, context) {
    return {
      configurationError() { return null; },
      isActive() { return true; },

      async stock(referenceDate) {
        // Return current stock quantity
        return 100;
      },
      async productionTime(quantity) {
        // Return production time in ms
        return 0;
      },
      async commissioningTime(quantity) {
        // Return commissioning time in ms
        return 24 * 60 * 60 * 1000; // 1 day
      },
      async estimatedStock() {
        return 100;
      },
      async estimatedDispatch() {
        return new Date();
      },
      // For tokenized products (NFTs):
      async tokenize() { return []; },
      async tokenMetadata(serial, date) { return {}; },
      async isInvalidateable(serial, date) { return false; },
    };
  },
};

WarehousingDirector.registerAdapter(MyWarehousingAdapter);
```

### Worker Director

Manages background job processing and scheduled tasks.

```typescript
import { WorkerDirector, type IWorkerAdapter } from '@unchainedshop/core';

interface MyInput { email: string; subject: string; }
interface MyOutput { messageId: string; }

const MyWorkerAdapter: IWorkerAdapter<MyInput, MyOutput> = {
  key: 'my-worker',
  label: 'My Background Worker',
  version: '1.0.0',
  type: 'MY_WORK_TYPE',          // Work type identifier
  external: false,                // Runs in-process
  maxParallelAllocations: 10,     // Max concurrent executions

  async doWork(input, unchainedAPI, workId) {
    // Process the work item
    const { email, subject } = input;

    // Return result
    return {
      success: true,
      result: { messageId: 'msg-123' },
    };
  },
};

WorkerDirector.registerAdapter(MyWorkerAdapter);

// Schedule recurring work
WorkerDirector.configureAutoscheduling({
  type: 'MY_WORK_TYPE',
  input: { email: 'test@example.com', subject: 'Test' },
  schedule: '0 * * * *', // Every hour (cron syntax)
});
```

### Pricing Directors

Pricing directors calculate prices using a chain of adapters. Each adapter can add, modify, or discount prices.

```typescript
import { ProductPricingDirector, type IProductPricingAdapter } from '@unchainedshop/core';

const MyPricingAdapter: IProductPricingAdapter = {
  key: 'my-pricing',
  label: 'My Pricing Logic',
  version: '1.0.0',
  orderIndex: 10, // Lower numbers run first

  isActivatedFor(context) {
    // Return true if this adapter should apply
    return true;
  },

  actions(params) {
    return {
      calculate() {
        // Add price calculations
        this.calculation.addItem({
          category: 'BASE',
          amount: 1000, // in smallest currency unit
        });
      },
    };
  },
};

ProductPricingDirector.registerAdapter(MyPricingAdapter);
```

### Discount Directors

Discount directors manage coupon codes and automatic discounts.

```typescript
import { OrderDiscountDirector, type IDiscountAdapter } from '@unchainedshop/core';

const MyDiscountAdapter: IDiscountAdapter = {
  key: 'my-discount',
  label: 'My Discount System',
  version: '1.0.0',
  orderIndex: 10,

  isManualAdditionAllowed(code) {
    return code.startsWith('PROMO');
  },
  isManualRemovalAllowed() {
    return true;
  },

  actions(context) {
    return {
      isValidForSystemTriggering() {
        // Auto-apply discount?
        return false;
      },
      isValidForCodeTriggering(code) {
        // Apply when code entered?
        return code === 'PROMO10';
      },
      discountForPricingAdapterKey(params) {
        // Return discount configuration for pricing adapter
        return {
          isNetPrice: false,
          rate: 0.1, // 10% off
        };
      },
      async reserve(code) {
        // Reserve discount (e.g., decrement coupon balance)
      },
      async release() {
        // Release reservation on order cancellation
      },
    };
  },
};

OrderDiscountDirector.registerAdapter(MyDiscountAdapter);
```

### Filter Director

Manages product filtering and search functionality.

```typescript
import { FilterDirector, type IFilterAdapter } from '@unchainedshop/core';

const MyFilterAdapter: IFilterAdapter = {
  key: 'my-filter',
  label: 'My Search Filter',
  version: '1.0.0',
  orderIndex: 10,

  actions(context) {
    return {
      async aggregateProductIds(params) {
        // Return product IDs matching filter
        return ['product-1', 'product-2'];
      },
      async searchProducts(params, options) {
        // Search products
        return { productIds: [], totalCount: 0 };
      },
      async searchAssortments(params, options) {
        // Search assortments
        return { assortmentIds: [], totalCount: 0 };
      },
      transformProductSelector(selector, options) {
        // Modify MongoDB product selector
        return selector;
      },
      transformFilterSelector(selector, options) {
        // Modify MongoDB filter selector
        return selector;
      },
      transformSortStage(sort, options) {
        // Modify MongoDB sort stage
        return sort;
      },
    };
  },
};

FilterDirector.registerAdapter(MyFilterAdapter);
```

### Messaging Director

The Messaging Director uses a template resolver pattern instead of traditional adapters.

```typescript
import { MessagingDirector } from '@unchainedshop/core';

// Register a message template
MessagingDirector.registerTemplate('ORDER_CONFIRMATION', async (context) => {
  const { order, user } = context;

  return [
    {
      type: 'EMAIL',
      input: {
        to: user.email,
        subject: `Order Confirmation #${order.orderNumber}`,
        html: '<h1>Thank you for your order!</h1>',
      },
    },
    {
      type: 'SMS',
      input: {
        to: user.phone,
        text: `Order #${order.orderNumber} confirmed!`,
      },
    },
  ];
});
```

### Quotation Director

Handles quotation/RFQ (Request for Quote) operations.

```typescript
import { QuotationDirector, type IQuotationAdapter } from '@unchainedshop/core';

const MyQuotationAdapter: IQuotationAdapter = {
  key: 'my-quotation',
  label: 'My Quote System',
  version: '1.0.0',

  isActivatedFor(quotationContext, unchainedAPI) {
    return true;
  },

  actions(context) {
    return {
      configurationError() { return null; },
      isManualProposalRequired() { return true; },
      isManualRequestVerificationRequired() { return false; },

      async quote() {
        // Generate quote
        return { price: 1000, currency: 'CHF' };
      },
      async submitRequest(quotationContext) {
        // Submit RFQ
      },
      async verifyRequest(quotationContext) {
        // Verify RFQ
      },
      async rejectRequest(quotationContext) {
        // Reject RFQ
      },
      transformItemConfiguration(params) {
        return params.configuration;
      },
    };
  },
};

QuotationDirector.registerAdapter(MyQuotationAdapter);
```

### Enrollment Director

Manages subscription/enrollment plans and recurring billing.

```typescript
import { EnrollmentDirector, type IEnrollmentAdapter } from '@unchainedshop/core';

const MyEnrollmentAdapter: IEnrollmentAdapter = {
  key: 'my-enrollment',
  label: 'My Subscription System',
  version: '1.0.0',

  isActivatedFor(productPlan) {
    return productPlan.type === 'PLAN_PRODUCT';
  },

  transformOrderItemToEnrollmentPlan(orderPosition, unchainedAPI) {
    return {
      configuration: orderPosition.configuration,
    };
  },

  actions(context) {
    return {
      async nextPeriod() {
        // Calculate next billing period
        return {
          start: new Date(),
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };
      },
      isValidForActivation() {
        return true;
      },
      isOverdue() {
        return false;
      },
      async configurationForOrder(period) {
        // Return order configuration for period
        return {};
      },
    };
  },
};

EnrollmentDirector.registerAdapter(MyEnrollmentAdapter);
```

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
import { createDrizzleDb } from '@unchainedshop/store';

// Create database connection
const { db: drizzleDb } = createDrizzleDb({
  url: process.env.DRIZZLE_DB_URL || 'file:unchained.db',
  authToken: process.env.DRIZZLE_DB_TOKEN,
});

const core = await initCore({
  drizzleDb,
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
