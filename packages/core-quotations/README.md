[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-quotations.svg)](https://npmjs.com/package/@unchainedshop/core-quotations)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-quotations

Quotation management module for the Unchained Engine. Handles quote requests, proposals, and quotation workflows for custom pricing.

## Installation

```bash
npm install @unchainedshop/core-quotations
```

## Usage

```typescript
import { configureQuotationsModule, QuotationStatus } from '@unchainedshop/core-quotations';

const quotationsModule = await configureQuotationsModule({ db, migrationRepository });

// Create a quotation request
const quotation = await quotationsModule.create({
  userId: 'user-123',
  currencyCode: 'CHF',
  productId: 'custom-product-456',
  configuration: [{ key: 'quantity', value: '1000' }],
});

// Store a proposal and update its status
await quotationsModule.updateProposal(quotation._id, {
  price: { amount: 5000, currencyCode: 'CHF' },
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
});
await quotationsModule.updateStatus(quotation._id, { status: QuotationStatus.PROPOSED });

// Find quotations
const quotations = await quotationsModule.findQuotations({
  userId: 'user-123',
});
```

For adapter validation and quotation workflows, use `services.quotations` in [`@unchainedshop/core`](../core/README.md).

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configureQuotationsModule` | Configure and return the quotations module |

### Queries

| Method | Description |
|--------|-------------|
| `findQuotation` | Find quotation by ID |
| `findQuotations` | Find quotations with filtering and pagination |
| `count` | Count quotations matching query |

### Mutations

| Method | Description |
|--------|-------------|
| `create` | Create a quotation request |
| `updateContext` | Update quotation context |
| `updateProposal` | Update proposal price, expiry, and metadata |
| `updateStatus` | Update quotation status |
| `deleteRequestedUserQuotations` | Delete a user's requested quotations |

### Constants

| Export | Description |
|--------|-------------|
| `QuotationStatus` | Status values (REQUESTED, PROCESSING, PROPOSED, FULFILLED, REJECTED) |

### Settings

| Export | Description |
|--------|-------------|
| `quotationsSettings` | Access quotation module settings |

### Types

| Export | Description |
|--------|-------------|
| `Quotation` | Quotation document type |
| `QuotationsModule` | Module interface type |

## Events

| Event | Description |
|-------|-------------|
| `QUOTATION_REQUEST_CREATE` | Quotation requested |
| `QUOTATION_UPDATE` | Quotation updated |
| `QUOTATION_REMOVE` | Quotation deleted |

## License

EUPL-1.2
