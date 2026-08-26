---
sidebar_position: 1
title: Payment Plugins
sidebar_label: Payment
description: Payment provider plugins for Unchained Engine
---

# Payment Plugins

Payment plugins integrate payment service providers with Unchained Engine. Built-in plugins are `IPlugin` objects that self-register their adapters, webhook routes, and database modules — register them via a [preset](../../platform-configuration/plugin-presets.md) or individually with `pluginRegistry.register(...)` before `startPlatform()`.

| Adapter Key | Description | Integration Type | Preset |
|-------------|-------------|-----------------|--------|
| [`shop.unchained.payment.stripe`](./stripe.md) | Stripe Payments | Server-side | `all` |
| [`shop.unchained.datatrans`](./datatrans.md) | Datatrans (Swiss PSP) | Hosted checkout | `all` |
| [`shop.unchained.payment.saferpay`](./saferpay.md) | Worldline Saferpay | Hosted checkout | `all` |
| [`shop.unchained.payment.postfinance-checkout`](./postfinance-checkout.md) | PostFinance Checkout | Hosted checkout | `all` |
| [`shop.unchained.payment.payrexx`](./payrexx.md) | Payrexx (TWINT, PostFinance) | Hosted checkout | `all` |
| [`shop.unchained.payment.cryptopay`](./cryptopay.md) | Self-hosted crypto payments | Server-side | `crypto`, `all` |
| [`shop.unchained.apple-iap`](./apple-iap.md) | Apple In-App Purchase | Native SDK | `all` |
| [`shop.unchained.invoice`](./invoice.md) | Pay-per-invoice (B2B) | Offline | `base`, `all` |
| [`shop.unchained.invoice-prepaid`](./invoice-prepaid.md) | Prepayment invoice | Offline | `all` |

## Checkout Flow

All gateway plugins (Stripe, Datatrans, Saferpay, PostFinance Checkout, Payrexx, Cryptopay) share the same flow. The provider pages only document the provider-specific parts.

**1. Get the order payment id of the active cart:**

```graphql
query {
  me {
    cart {
      payment {
        _id
      }
    }
  }
}
```

**2. Sign the payment** — returns a provider-specific JSON string (client secret, redirect URL, payment addresses, ...):

```graphql
mutation {
  signPaymentProviderForCheckout(
    orderPaymentId: "order-payment-id"
    transactionContext: {} # provider-specific options
  )
}
```

**3. Process the payment client-side** (redirect, SDK, or wallet transfer — see the provider page).

**4. Webhook completes the checkout.** The payment provider calls the plugin's auto-registered webhook route; Unchained validates the transaction and checks out the cart server-side.

**5. Fallback: client-side checkout.** If the webhook has not completed the checkout (e.g. it failed or is still in flight), call `checkoutCart` yourself with the provider-specific `paymentContext`:

```graphql
mutation {
  checkoutCart(paymentContext: { transactionId: "..." }) {
    _id
    status
  }
}
```

This gives Unchained a second chance to process and settle the payment.

## Creating Custom Payment Plugins

See [Custom Payment Plugins](../../extend/order-fulfilment/fulfilment-plugins/payment.md) and the [`registerPaymentProvider` factory](../../extend/plugin-factories.md#payment).
