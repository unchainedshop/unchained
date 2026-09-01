---
sidebar_position: 13
title: Invoice Payment
sidebar_label: Invoice
description: Pay-per-invoice payment method for B2B and established customers
---

# Invoice Payment

Pay-later invoice payment: `isPayLaterAllowed` is `true`, so orders are confirmed immediately at checkout and payment is handled out of band through your invoicing system. No payment processing happens in Unchained.

## Installation

Included in the [`base` and `all` presets](../../platform-configuration/plugin-presets.md) — registered automatically by `registerBasePlugins()` / `registerAllPlugins()`.

To register it individually:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { InvoicePlugin } from '@unchainedshop/plugins/payment/invoice';

pluginRegistry.register(InvoicePlugin);
```

## Create Provider

```graphql
mutation CreateInvoiceProvider {
  createPaymentProvider(
    paymentProvider: {
      type: INVOICE
      adapterKey: "shop.unchained.invoice"
    }
  ) {
    _id
  }
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.invoice` |
| Type | `INVOICE` |
| Version | `1.0.0` |
| Source | [payment/invoice/](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/payment/invoice) |

## Related

- [Invoice Prepaid](./invoice-prepaid.md) - Prepayment required before order confirmation
