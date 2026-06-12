---
sidebar_position: 8
sidebar_label: Payment
title: Write a Payment Provider Plugin
description: Guide to writing a custom payment provider plugin for Unchained Engine.
---

# Payment Provider Plugins

Payment adapters handle payment processing for orders. Unchained supports `INVOICE` and `GENERIC` providers; card gateways such as Stripe use the generic provider type.

For an overview of how payment fits into the order lifecycle, see [Order Lifecycle](../../../concepts/order-lifecycle).

## Payment Types

| Type | Description | Use Cases |
|------|-------------|-----------|
| `INVOICE` | Invoice-based payments | Pre-paid or post-paid invoices |
| `GENERIC` | Gateway-backed and other payment methods | Stripe, Datatrans, crypto, bank transfer, cash |

## Creating a payment provider

The recommended way is the [`registerPaymentProvider`](../../plugin-factories.md#payment) factory (or [`registerInvoicePayment`](../../plugin-factories.md#payment) for invoices). You supply only the behavior callbacks; the factory builds and registers the plugin.

### Example: pre-paid invoice

A pre-paid invoice blocks order confirmation until payment is received — `charge: false` keeps the order `PENDING`, and `payLaterAllowed: false` requires payment before confirmation.

```typescript
import { registerInvoicePayment } from '@unchainedshop/core';

registerInvoicePayment({
  adapterId: 'prepaid-invoice',
  payLaterAllowed: false,
  charge: false, // payment is collected out of band; order stays PENDING
});
```

### Example: card payment with Stripe

```typescript
import Stripe from 'stripe';
import {
  OrderPricingSheet,
  PaymentError,
  registerPaymentProvider,
} from '@unchainedshop/core';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

registerPaymentProvider({
  adapterId: 'stripe-card',
  type: 'GENERIC',
  configurationError: process.env.STRIPE_SECRET_KEY
    ? null
    : PaymentError.INCOMPLETE_CONFIGURATION,

  // Client-side SDK initialization
  sign: async (configuration, context) => {
    if (!context.order) return null;
    const pricing = OrderPricingSheet({
      calculation: context.order.calculation,
      currencyCode: context.order.currencyCode,
    });
    const intent = await stripe.paymentIntents.create({
      amount: pricing.total().amount,
      currency: context.order.currencyCode.toLowerCase(),
      metadata: { orderId: context.order._id },
    });
    return intent.client_secret;
  },

  // Confirm the charge (here, validated via webhook)
  charge: async (configuration, context) => {
    const intentId = context.orderPayment?.context?.paymentIntentId;
    if (!intentId) return false;
    const intent = await stripe.paymentIntents.retrieve(intentId);
    return intent.status === 'succeeded' ? { transactionId: intent.id } : false;
  },

  cancel: async (configuration, context) => {
    if (context.orderPayment?.transactionId) {
      await stripe.refunds.create({ payment_intent: context.orderPayment.transactionId });
    }
    return true;
  },
});
```

## Callback reference

These are the callbacks you pass to `registerPaymentProvider` (each receives `(configuration, context)`).

### `charge`

Process the payment charge. Called during checkout.

| Return Value | Behavior |
|--------------|----------|
| `{ transactionId }` | Payment successful, proceed with checkout |
| `false` | Payment not complete yet, order stays in PENDING |
| Throws error | Abort checkout, order stays in OPEN (cart) |

Pass `false` (not a function) for providers where payment is collected out of band.

### `isActive` / `isPayLaterAllowed`

`isActive` (boolean, default `true`) toggles availability. `isPayLaterAllowed` (boolean, default `false`) controls whether order confirmation can proceed before payment completes — `true` = post-paid, `false` = pre-paid.

### `sign` / `validate`

`sign(configuration, context)` returns a client token (e.g. a Stripe `client_secret`) for the front-end SDK. `validate(configuration, context)` validates a stored credential.

### `cancel` / `confirm`

`cancel` refunds/voids a payment (called on order rejection); `confirm` captures a previously-authorized payment (called on `CONFIRMED`).

### `configurationError`

A `PaymentError | null` surfaced when the provider is misconfigured (for example `PaymentError.INCOMPLETE_CONFIGURATION`) so it is marked invalid instead of crashing checkout.

## Webhooks & low-level adapters

Most gateways confirm payments asynchronously via a webhook. To attach a webhook route (and for any behavior the factory doesn't expose), build a hand-written `IPlugin` with a `routes` entry and `pluginRegistry.register()` — see the shipped [Stripe plugin](../../../plugins/payment/stripe) and [Plugin System](../../../concepts/director-adapter-pattern.md#adapter-contracts).

## Related

- [Plugin Factories](../../plugin-factories.md#payment) — `registerPaymentProvider` / `registerInvoicePayment`
- [Plugin System](../../../concepts/director-adapter-pattern.md) — the plugin architecture
- [Order Lifecycle](../../../concepts/order-lifecycle) — how payment fits into checkout
- [Stripe Plugin](../../../plugins/payment/stripe) — a complete shipped adapter
