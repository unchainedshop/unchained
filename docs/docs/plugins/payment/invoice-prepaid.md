---
sidebar_position: 14
title: Invoice Prepaid Payment
sidebar_label: Invoice Prepaid
description: Prepayment invoice method requiring payment confirmation before fulfillment
---

# Invoice Prepaid Payment

Prepaid invoice payment plugin that requires payment confirmation before order fulfillment, typically used for prepayment scenarios like bank transfers.

## Installation

```typescript
import '@unchainedshop/plugins/payment/invoice-prepaid';
```

## Setup

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

## Features

- **Pay Later Not Allowed**: Payment must be confirmed before order completion
- **Manual Payment Confirmation**: Requires manual confirmation of payment receipt
- **Order Hold**: Orders remain pending until payment is confirmed
- **Payment Verification**: Manual verification process required

## Use Cases

- **Prepayment Required**: Orders requiring payment before processing
- **Bank Transfer Payments**: Manual confirmation of wire transfers
- **Check Payments**: Orders paid by check requiring manual verification
- **High-Value Orders**: Orders requiring payment confirmation before shipping

## Payment Flow

1. **Create Order**: Customer places order
2. **Checkout**: Order enters pending payment status
3. **Payment Request**: Send payment instructions to customer
4. **Payment Confirmation**: Manually confirm payment receipt in admin
5. **Order Processing**: Order moves to confirmed status after payment confirmation

## Confirming Payments

Use the admin interface or GraphQL to confirm payments:

```graphql
mutation ConfirmPayment {
  confirmOrder(orderId: "order-id") {
    _id
    status
  }
}
```

## Integration Notes

- Orders require manual payment confirmation
- Use admin interface to confirm payments
- Suitable for one-time customers or high-risk orders
- Manual oversight required for each transaction

## Comparison with Standard Invoice

| Feature | Standard Invoice | Invoice Prepaid |
|---------|------------------|-----------------|
| Order Confirmation | Immediate | After payment |
| Pay Later | Yes | No |
| Payment Processing | External | Manual confirmation |
| Use Case | Established customers | New/high-risk customers |
| Administrative Overhead | Low | High |
| Cash Flow | Delayed | Immediate |

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.invoice-prepaid` |
| Type | `INVOICE` |
| Source | [payment/invoice-prepaid.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/payment/invoice-prepaid.ts) |

## Related

- [Invoice Payment](./invoice.md) - Standard invoice
- [Plugins Overview](./) - All available plugins
- [Payment Integration Guide](../../guides/payment-integration.md) - Payment setup guide
