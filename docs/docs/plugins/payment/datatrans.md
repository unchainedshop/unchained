---
sidebar_position: 2
title: Datatrans
sidebar_label: Datatrans
description: Swiss payment service provider with multiple payment methods
---

# Datatrans

Payment plugin for [Datatrans](https://docs.datatrans.ch/docs/home), a Swiss payment service provider supporting redirect, lightbox, secure fields, and mobile SDK integrations.

## Installation

Included in the [`all` preset](../../platform-configuration/plugin-presets.md) — `registerAllPlugins()` registers the plugin together with its webhook route.

To register it individually:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { DatatransPlugin } from '@unchainedshop/plugins/payment/datatrans-v2';

pluginRegistry.register(DatatransPlugin);
```

Register before `startPlatform()`. Registration mounts the webhook route `POST /payment/datatrans/webhook` (path configurable via `DATATRANS_WEBHOOK_PATH`) on the Unchained HTTP server. Registration throws if neither `DATATRANS_SIGN_KEY` nor `DATATRANS_SIGN2_KEY` is set.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATATRANS_SECRET` | - | API secret (required) |
| `DATATRANS_SIGN_KEY` | - | Signing key (required — without it every Datatrans provider reports `INCOMPLETE_CONFIGURATION`) |
| `DATATRANS_SIGN2_KEY` | - | Secondary signing key, takes precedence for webhook verification |
| `DATATRANS_SECURITY` | `dynamic-sign` | `''`, `'static-sign'`, or `'dynamic-sign'` |
| `DATATRANS_API_ENDPOINT` | `https://api.sandbox.datatrans.com` | API endpoint (use non-sandbox for production) |
| `DATATRANS_WEBHOOK_PATH` | `/payment/datatrans/webhook` | Webhook endpoint path |
| `DATATRANS_SUCCESS_PATH` | `/datatrans/success` | Success redirect path (relative to `EMAIL_WEBSITE_URL`) |
| `DATATRANS_ERROR_PATH` | `/datatrans/error` | Error redirect path (relative to `EMAIL_WEBSITE_URL`) |
| `DATATRANS_CANCEL_PATH` | `/datatrans/cancel` | Cancel redirect path (relative to `EMAIL_WEBSITE_URL`) |
| `DATATRANS_RETURN_PATH` | `/datatrans/return` | Return redirect path (relative to `EMAIL_WEBSITE_URL`) |
| `DATATRANS_MERCHANT_ID` | - | Default merchant ID (fallback if not set in provider config) |

## Create Provider

```graphql
mutation CreateDatatransProvider {
  createPaymentProvider(
    paymentProvider: {
      type: GENERIC
      adapterKey: "shop.unchained.datatrans"
    }
  ) {
    _id
  }
}

mutation ConfigureDatatransProvider {
  updatePaymentProvider(
    paymentProviderId: "provider-id"
    paymentProvider: {
      configuration: [
        { key: "merchantId", value: "your-merchant-id" }
      ]
    }
  ) {
    _id
  }
}
```

Provider configuration:

| Key | Default | Description |
|-----|---------|-------------|
| `merchantId` | `DATATRANS_MERCHANT_ID` | Datatrans merchant ID |
| `settleInUnchained` | enabled | Settlement in Unchained: `"1"` to enable, `""` to disable |
| `marketplaceSplit` | - | Marketplace split config: `"SUBMERCHANTID;STATIC_DISCOUNT_ID;SHARE_PERCENTAGE"` — the middle field is an OrderDiscount `_id` whose payment-pricing discount rows determine the commission; repeatable for multi-merchant splits; requires `settleInUnchained` = `1` and a custom discount adapter for commissions. See [Datatrans Marketplace docs](https://docs.datatrans.ch/docs/marketplace-payments#section-settlement-splits). |

## Payment Flow

Follows the standard [checkout flow](./index.md#checkout-flow). Datatrans specifics:

`signPaymentProviderForCheckout` (checkout) and `signPaymentProviderForCredentialRegistration` (credential registration without checkout) return a JSON string:

```json
{
  "location": "https://pay.sandbox.datatrans.com/v1/start/xyz1234..",
  "transactionId": "xyz1234.."
}
```

### Redirect / Lightbox

Redirect to `location` ("Redirect" mode) or use `transactionId` with the "Lightbox" mode as shown in the [Datatrans redirect/lightbox docs](https://docs.datatrans.ch/docs/redirect-lightbox).

On successful payment, Datatrans calls the webhook (`DATATRANS_WEBHOOK_PATH`); Unchained validates the transaction, checks out the cart, settles the payment, and stores the payment credential alias for faster future checkouts. Datatrans then redirects the user to `DATATRANS_SUCCESS_PATH` with the `transactionId` in the query parameters.

If the webhook has not completed the checkout by the time the success page loads, fall back to client-side checkout:

```graphql
mutation {
  checkoutCart(
    orderId: "order id from query parameter"
    paymentContext: { transactionId: "transaction id from query parameter" }
  ) {
    _id
    status
  }
}
```

:::warning Asynchronous webhook
Don't enable Datatrans' [asynchronous webhook](https://docs.datatrans.ch/docs/redirect-lightbox#section-webhook) option — you'd have to poll the order status after checkout and would miss a whole category of errors to save ~1s of processing time.
:::

### Secure Fields

Pass `{ "useSecureFields": true }` as `transactionContext` to `signPaymentProviderForCheckout` or `signPaymentProviderForCredentialRegistration` so Unchained initializes the transaction via `/v1/transactions/secureFields`. Secure-fields transactions need an authorize step at checkout — pass `authorizeAuthenticated` (an empty object if you have no `CDM`/`3D` props):

```graphql
mutation {
  checkoutCart(
    orderId: "order id from query parameter"
    paymentContext: {
      transactionId: "transaction id from query parameter"
      authorizeAuthenticated: {}
    }
  ) {
    _id
    status
  }
}
```

### Mobile SDK

To receive [mobile tokens](https://docs.datatrans.ch/docs/mobile-sdk#section-initializing-transactions), pass `{ "option": { "returnMobileToken": true } }` as `transactionContext` to `signPaymentProviderForCheckout`.

### Advanced

- **Restrict payment methods:** arbitrary `transactionContext` fields are forwarded to the `/v1/transactions` init request, e.g. `{ "paymentMethods": ["VIS"] }` restricts checkout to VISA.
- **Checkout with alias:** call `checkoutCart` without signing first — if the user has stored payment credentials for the Datatrans provider, the plugin charges them directly.

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.datatrans` |
| Type | `GENERIC` |
| Version | `2.0.0` |
| Source | [payment/datatrans-v2/](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/payment/datatrans-v2) |
