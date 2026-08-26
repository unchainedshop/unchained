---
sidebar_position: 6
title: Saferpay
sidebar_label: Saferpay
description: Worldline Saferpay payment integration
---

# Saferpay

Payment plugin for [Worldline Saferpay](https://saferpay.github.io/jsonapi/), using the Payment Page API.

## Installation

Included in the [`all` preset](../../platform-configuration/plugin-presets.md) — `registerAllPlugins()` registers the plugin together with its webhook route and database module.

To register it individually:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { SaferpayPlugin } from '@unchainedshop/plugins/payment/saferpay';

pluginRegistry.register(SaferpayPlugin);
```

Register before `startPlatform()`. Registration mounts the webhook route `GET /payment/saferpay/webhook` (path configurable via `SAFERPAY_WEBHOOK_PATH`) and adds the `saferpayTransactions` database module. Registration throws unless `SAFERPAY_CUSTOMER_ID`, `SAFERPAY_TERMINAL_ID`, `SAFERPAY_API_USER`, and `SAFERPAY_API_PASSWORD` are all set.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SAFERPAY_CUSTOMER_ID` | - | Saferpay customer ID (required at registration and by the API client) |
| `SAFERPAY_TERMINAL_ID` | - | Saferpay terminal ID (required at registration; the adapter itself reads the `terminalId` provider configuration) |
| `SAFERPAY_API_USER` | - | API username (required at registration) |
| `SAFERPAY_API_PASSWORD` | - | API password (required at registration) |
| `SAFERPAY_USER` | - | API username — currently read by the API client (see note below) |
| `SAFERPAY_PW` | - | API password — currently read by the API client and webhook signature (see note below) |
| `SAFERPAY_BASE_URL` | `https://test.saferpay.com/api` | API base URL. Production: `https://www.saferpay.com/api` |
| `SAFERPAY_WEBHOOK_PATH` | `/payment/saferpay/webhook` | Webhook endpoint path |
| `SAFERPAY_RETURN_PATH` | `/saferpay/return` | User return URL path after payment |
| `ROOT_URL` | `http://localhost:4010` | Base URL for webhook notifications |
| `EMAIL_WEBSITE_URL` | - | Base URL for user redirects (falls back to `ROOT_URL`) |

:::warning SAFERPAY_USER / SAFERPAY_PW
Plugin registration validates `SAFERPAY_API_USER` / `SAFERPAY_API_PASSWORD`, but the adapter's API client and webhook signature currently read `SAFERPAY_USER` / `SAFERPAY_PW`. Until this is unified, set **both** pairs to the same credentials.
:::

## Create Provider

```graphql
mutation CreateSaferpayProvider {
  createPaymentProvider(
    paymentProvider: {
      type: GENERIC
      adapterKey: "shop.unchained.payment.saferpay"
    }
  ) {
    _id
  }
}

mutation ConfigureSaferpayProvider {
  updatePaymentProvider(
    paymentProviderId: "provider-id"
    paymentProvider: {
      configuration: [
        { key: "terminalId", value: "your-terminal-id" }
      ]
    }
  ) {
    _id
  }
}
```

Provider configuration:

| Key | Description |
|-----|-------------|
| `terminalId` | Saferpay terminal ID (required — the provider is inactive without it) |

To use multiple terminals (e.g. one per currency), create multiple providers with different `terminalId` values.

## Payment Flow

Follows the standard [checkout flow](./index.md#checkout-flow). Saferpay specifics:

`signPaymentProviderForCheckout` initializes a Payment Page and returns a JSON string:

```json
{
  "location": "https://test.saferpay.com/vt2/api/PaymentPage/...",
  "token": "saferpay-token",
  "transactionId": "hex-transaction-id"
}
```

Redirect the user to `location`. After payment, the user returns to `EMAIL_WEBSITE_URL + SAFERPAY_RETURN_PATH?transactionId=<hex-id>`, and Saferpay notifies the webhook (`ROOT_URL + SAFERPAY_WEBHOOK_PATH?orderPaymentId=<id>&signature=<sig>&transactionId=<hex-id>`, signature verified server-side), which checks out the cart. Fallback — checkout with the transaction id:

```graphql
mutation {
  checkoutCart(paymentContext: { transactionId: "hex-transaction-id" }) {
    _id
    status
  }
}
```

The charge succeeds when the Saferpay transaction amount and currency match the order and its status is `AUTHORIZED` or `CAPTURED`.

Optional `transactionContext` fields for `signPaymentProviderForCheckout`: `description` (payment description, default "Bestellung"), `Payment` (override payment details), `ReturnUrl` (override return URL). Additional fields are forwarded to the Payment Page Initialize request.

## Capture and Cancel

`AUTHORIZED` transactions are captured on `confirmOrder` and cancelled on `rejectOrder`:

```graphql
mutation ConfirmOrder {
  confirmOrder(orderId: "order-id") {
    _id
    status
  }
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.payment.saferpay` |
| Type | `GENERIC` |
| Version | `1.38.0` |
| Source | [payment/saferpay/](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/payment/saferpay) |
