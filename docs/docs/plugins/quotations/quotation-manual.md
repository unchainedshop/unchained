---
sidebar_position: 1
title: Manual Quotations
sidebar_label: Manual
description: Simple manual quotation adapter with configurable expiry
---

# Manual Quotations

A quotation adapter for human-reviewed price negotiation: an admin proposes a price via `makeQuotationProposal`, and the resulting quote expires after 1 hour by default.

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` and `registerAllPlugins()`.
:::

If you register plugins individually instead of using a preset:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { ManualOfferingPlugin } from '@unchainedshop/plugins/quotations/manual';

pluginRegistry.register(ManualOfferingPlugin);
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.quotations.manual` |
| Order Index | `0` |
| Activation | All products (`isActivatedFor` returns `true`) |
| Source | [quotations/manual](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/quotations/manual) |

## Behavior

`quote()` derives the proposal from the persisted quotation context:

- `price`: taken from `quotation.context.price` (minor units of the quotation's currency), i.e. whatever was passed to `makeQuotationProposal`
- `expires`: `quotation.context.expires` if set, otherwise now + 1 hour

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

### Admin: Make a Proposal

`quotationContext` is stored on the quotation and read by `quote()`:

```graphql
mutation MakeProposal {
  makeQuotationProposal(
    quotationId: "quotation-id"
    quotationContext: { price: 8999 }
  ) {
    _id
    status
  }
}
```

### Verify a Request

```graphql
mutation VerifyQuotation {
  verifyQuotation(quotationId: "quotation-id") {
    _id
    status
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

## Quotation States

| Status | Description |
|--------|-------------|
| `REQUESTED` | Request for proposal |
| `PROCESSING` | Awaiting offer |
| `PROPOSED` | A price has been proposed |
| `FULFILLED` | Quotation has been accepted and used |
| `REJECTED` | Quotation was rejected |

## Custom Quotation Logic

Use the `registerQuotation` factory:

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

## Related

- [Custom Quotation Plugins](../../extend/quotation.md) - Write your own
