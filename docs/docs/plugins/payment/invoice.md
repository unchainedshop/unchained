---
sidebar_position: 13
title: Invoice Payment
sidebar_label: Invoice
description: Pay-per-invoice payment method for B2B and established customers
---

# Invoice Payment

Standard invoice payment plugin that allows orders to be confirmed immediately with payment processed separately through your invoicing system.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/payment/invoice';
```

## Setup

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

## Features

- **Pay Later Allowed**: Orders can be confirmed before payment is received
- **Immediate Order Confirmation**: Orders are processed immediately upon checkout
- **External Payment Processing**: Payment is handled through your separate invoicing system
- **No Payment Validation**: No upfront payment verification required

## Use Cases

- **B2B Sales**: Business customers with established credit terms
- **Traditional Invoicing**: Standard invoice-then-pay workflow
- **Credit Customers**: Customers with approved payment terms
- **Wholesale Orders**: Large orders with net payment terms

## Payment Flow

1. **Create Order**: Customer places order normally
2. **Checkout**: Order is confirmed immediately
3. **Invoice Generation**: Generate invoice through your external system
4. **Payment Processing**: Handle payment through your invoicing workflow
5. **Order Fulfillment**: Process and ship order

## Integration Notes

- Orders are confirmed immediately upon checkout
- No payment processing happens in Unchained
- Integration with external invoicing systems required
- Suitable for established business relationships

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.invoice` |
| Type | `INVOICE` |
| Source | [payment/invoice.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/payment/invoice.ts) |

## Related

- [Invoice Prepaid](./invoice-prepaid.md) - Prepayment required
- [Plugins Overview](./) - All available plugins
- [Payment Integration Guide](../../guides/payment-integration.md) - Payment setup guide
