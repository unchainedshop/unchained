---
sidebar_position: 1
title: Manual Quotations
sidebar_label: Manual
description: Simple manual quotation adapter with configurable expiry
---

# Manual Quotations

A simple quotation adapter that creates quotations with a 1-hour expiration time. Ideal for manual price negotiation workflows.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/quotations/manual';
```

## Features

- **Automatic Activation**: Activated for all products
- **1-Hour Expiry**: Quotations expire after 1 hour by default
- **Simple Implementation**: Minimal configuration required
- **Manual Workflow**: Designed for human-reviewed quotations

## How It Works

1. Customer requests a quotation for a product
2. The adapter creates a quotation that expires in 1 hour
3. Admin reviews and can adjust the quotation
4. Customer accepts or the quotation expires

## Usage

### Request a Quotation

```graphql
mutation RequestQuotation {
  requestQuotation(
    productId: "product-id"
    configuration: [
      { key: "quantity", value: "100" }
      { key: "notes", value: "Bulk order for corporate event" }
    ]
  ) {
    _id
    status
    expires
  }
}
```

### Query Quotations

```graphql
query MyQuotations {
  me {
    quotations {
      _id
      status
      product {
        texts { title }
      }
      expires
      quotationNumber
    }
  }
}
```

### Admin: Make Quotation Proposal

```graphql
mutation MakeProposal {
  makeQuotationProposal(
    quotationId: "quotation-id"
    quotationContext: {
      price: 8999
      currency: "CHF"
    }
  ) {
    _id
    status
  }
}
```

### Accept Quotation

```graphql
mutation AcceptQuotation {
  verifyQuotation(quotationId: "quotation-id") {
    _id
    status
  }
}
```

## Quotation States

| Status | Description |
|--------|-------------|
| `REQUESTED` | Customer has requested a quotation |
| `PROCESSING` | Quotation is being processed |
| `PROPOSED` | A price has been proposed |
| `FULFILLED` | Quotation has been accepted and used |
| `REJECTED` | Quotation was rejected or expired |

## Extending the Adapter

For custom quotation logic, use `registerQuotation`:

```typescript
import { registerQuotation } from '@unchainedshop/core';

registerQuotation({
  adapterId: 'bulk-pricing',
  quote: async ({ quotation }) => {
    if (!quotation) return {};
    const quantity =
      Number(quotation.configuration?.find((entry) => entry.key === 'quantity')?.value) || 1;
    const basePrice = await catalogPriceFor(quotation.productId, quotation.currencyCode);
    const discount = quantity > 100 ? 0.15 : quantity > 50 ? 0.1 : 0.05;

    return {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: Math.round(basePrice * quantity * (1 - discount)),
    };
  },
});
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.quotations.manual` |
| Version | `1.0.0` |
| Order Index | `0` |
| Source | [quotations/manual.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/quotations/manual.ts) |

## Related

- [Plugins Overview](./) - All available plugins
- [Custom Quotation Plugins](../../extend/quotation.md) - Write your own
