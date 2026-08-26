---
sidebar_position: 4
title: PostFinance Checkout
sidebar_label: PostFinance
description: Swiss PostFinance payment service integration
---

# PostFinance Checkout

Payment plugin for [PostFinance Checkout](https://checkout.postfinance.ch/de-ch/doc/api/web-service) with support for all payment methods, three integration modes (payment page, lightbox, iFrame), deferred settlements, and refunds.

## Installation

Included in the [`all` preset](../../platform-configuration/plugin-presets.md) — `registerAllPlugins()` registers the plugin together with its webhook route.

To register it individually:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { PostfinanceCheckoutPlugin } from '@unchainedshop/plugins/payment/postfinance-checkout';

pluginRegistry.register(PostfinanceCheckoutPlugin);
```

Register before `startPlatform()`. Registration mounts the webhook route `POST /payment/postfinance-checkout` (path configurable via `PFCHECKOUT_WEBHOOK_PATH`) on the Unchained HTTP server. Registration throws unless `PFCHECKOUT_SPACE_ID`, `PFCHECKOUT_USER_ID`, `PFCHECKOUT_SECRET`, `PFCHECKOUT_SUCCESS_URL`, and `PFCHECKOUT_FAILED_URL` are all set.

Configure [webhook listeners](https://checkout.postfinance.ch/space/select?target=/webhook/listener/list) in the PostFinance Checkout web interface for successful and failed transaction completion ("Verbuchung der Transaktion" → "Erfolgreich" / "Fehlgeschlagen").

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PFCHECKOUT_SPACE_ID` | - | PostFinance Checkout space ID (required) |
| `PFCHECKOUT_USER_ID` | - | PostFinance API user ID (required) |
| `PFCHECKOUT_SECRET` | - | PostFinance API secret (required) |
| `PFCHECKOUT_SUCCESS_URL` | - | URL for successful payment redirect, appends `?order_id=<id>` (required) |
| `PFCHECKOUT_FAILED_URL` | - | URL for failed payment redirect, appends `?order_id=<id>` (required) |
| `PFCHECKOUT_WEBHOOK_PATH` | `/payment/postfinance-checkout` | Webhook endpoint path |

## Create Provider

```graphql
mutation CreatePostFinanceProvider {
  createPaymentProvider(
    paymentProvider: {
      type: GENERIC
      adapterKey: "shop.unchained.payment.postfinance-checkout"
    }
  ) {
    _id
  }
}
```

Provider configuration (via `updatePaymentProvider`):

| Key | Description |
|-----|-------------|
| `completionMode` | `Deferred` (default) — only create a reservation to be completed/voided later, or `Immediate` — complete transactions right away. Not all payment methods support deferred settlement. |

## Payment Flow

Follows the standard [checkout flow](./index.md#checkout-flow). PostFinance specifics:

`signPaymentProviderForCheckout` accepts an `integrationMode` in the `transactionContext` — `PaymentPage` (default), `Lightbox`, or `iFrame`:

```graphql
mutation {
  signPaymentProviderForCheckout(
    orderPaymentId: "order-payment-id"
    transactionContext: { integrationMode: "Lightbox" }
  )
}
```

It returns a JSON string:

```json
{
  "transactionId": 424242,
  "location": "https://checkout.postfinance.ch/s/25563/payment/transaction/pay/424242?securityToken=<token>"
}
```

For `PaymentPage`, `location` is the URL to redirect the user to. For `Lightbox` and `iFrame`, it is the JavaScript URL to embed (e.g. `.../assets/payment/lightbox-checkout-handler.js?spaceId=...`). The URL is fetched from the PostFinance API — don't construct it yourself, the schema could change.

After successful payment, the webhook marks the order as paid. Fallback — call `checkoutCart` and the plugin re-checks the transaction:

```graphql
mutation {
  checkoutCart(orderId: "order id from query parameter") {
    _id
    status
  }
}
```

## Deferred Completion, Cancellation, Refunds

With `completionMode: Deferred`, only a reservation is created — confirming the order (e.g. from an ERP that handles payment flows) is your responsibility.

`rejectOrder` cancels the payment in both cases: it voids an uncompleted reservation, or refunds a completed transaction.

## Saved Payment Methods

Tokenization mode is set to `ALLOW_ONE_CLICK_PAYMENT` and the Unchained customer ID is passed to the PostFinance API — returning users can select their saved payment method directly.

## Testing

Create a dedicated space in the PostFinance Checkout web interface, set it to testing mode, and point `PFCHECKOUT_SPACE_ID` at it. Test payment methods appear in the web interface.

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.payment.postfinance-checkout` |
| Type | `GENERIC` |
| Version | `1.0.0` |
| Source | [payment/postfinance-checkout/](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/payment/postfinance-checkout) |
