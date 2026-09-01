---
sidebar_position: 14
title: Invoice Prepaid Payment
sidebar_label: Invoice Prepaid
description: Prepayment invoice method requiring payment confirmation before fulfillment
---

# Invoice Prepaid Payment

Prepaid invoice payment: `isPayLaterAllowed` is `false` and `charge` returns `false`, so orders stay pending until you confirm payment receipt manually — typical for bank transfer / proforma invoice flows.

## Installation

Included in the [`all` preset](../../platform-configuration/plugin-presets.md) — registered automatically by `registerAllPlugins()`.

To register it individually:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { InvoicePrepaidPlugin } from '@unchainedshop/plugins/payment/invoice-prepaid';

pluginRegistry.register(InvoicePrepaidPlugin);
```

## Create Provider

```graphql
mutation CreatePrepaidInvoiceProvider {
  createPaymentProvider(
    paymentProvider: {
      type: INVOICE
      adapterKey: "shop.unchained.invoice-prepaid"
    }
  ) {
    _id
  }
}
```

## Confirming Payments

Confirm payment receipt via the Admin UI or GraphQL:

```graphql
mutation ConfirmPayment {
  confirmOrder(orderId: "order-id") {
    _id
    status
  }
}
```

## Comparison with Standard Invoice

| | Standard Invoice | Invoice Prepaid |
|---------|------------------|-----------------|
| Order confirmation | Immediate | After manual payment confirmation |
| Pay later | Yes | No |

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.invoice-prepaid` |
| Type | `INVOICE` |
| Version | `1.0.0` |
| Source | [payment/invoice-prepaid/](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/payment/invoice-prepaid) |

## Related

- [Invoice Payment](./invoice.md) - Standard pay-later invoice
