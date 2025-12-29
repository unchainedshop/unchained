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

const quotationsModule = await configureQuotationsModule({ db });

// Create a quotation request
const quotationId = await quotationsModule.create({
  userId: 'user-123',
  productId: 'custom-product-456',
  configuration: [{ key: 'quantity', value: '1000' }],
});

// Propose a quote
await quotationsModule.propose(quotationId, {
  price: { amount: 5000, currency: 'CHF' },
  expiresAt: new Date('2024-12-31'),
});

// Find quotations
const quotations = await quotationsModule.findQuotations({
  status: QuotationStatus.PROPOSED,
});
```

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
| `quotationExists` | Check if quotation exists |

### Mutations

| Method | Description |
|--------|-------------|
| `create` | Create a quotation request |
| `update` | Update quotation data |
| `delete` | Delete a quotation |
| `propose` | Propose a quote |
| `verify` | Verify a quotation |
| `reject` | Reject a quotation |
| `fulfill` | Mark quotation as fulfilled |

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
| `QuotationConfiguration` | Configuration item type |
| `QuotationsModule` | Module interface type |

## Events

| Event | Description |
|-------|-------------|
| `QUOTATION_CREATE` | Quotation requested |
| `QUOTATION_UPDATE` | Quotation updated |
| `QUOTATION_REMOVE` | Quotation deleted |
| `QUOTATION_PROPOSE` | Quote proposed |
| `QUOTATION_REJECT` | Quotation rejected |
| `QUOTATION_FULLFILL` | Quotation fulfilled |

## License

EUPL-1.2
