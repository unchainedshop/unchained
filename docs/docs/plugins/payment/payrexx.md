---
sidebar_position: 10
title: Payrexx
sidebar_label: Payrexx
description: Swiss payment provider supporting TWINT, PostFinance, and more
---

# Payrexx

Payment plugin for [Payrexx](https://docs.payrexx.com), a Swiss payment service provider supporting credit cards, TWINT, PostFinance, and more.

## Installation

Included in the [`all` preset](../../platform-configuration/plugin-presets.md) — `registerAllPlugins()` registers the plugin together with its webhook route.

To register it individually:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { PayrexxPlugin } from '@unchainedshop/plugins/payment/payrexx';

pluginRegistry.register(PayrexxPlugin);
```

Register before `startPlatform()`. Registration mounts the webhook route `POST /payment/payrexx` (path configurable via `PAYREXX_WEBHOOK_PATH`) on the Unchained HTTP server. Registration throws if `PAYREXX_SECRET` is not set.

In your Payrexx dashboard, configure the webhook URL `https://your-domain.com/payment/payrexx` and enable transaction notifications.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PAYREXX_SECRET` | - | Payrexx API secret key (required, registration throws without it) |
| `PAYREXX_WEBHOOK_PATH` | `/payment/payrexx` | Webhook endpoint path |
| `EMAIL_WEBSITE_URL` | - | Base URL for redirects (e.g. `https://shop.example.com`) |
| `EMAIL_WEBSITE_NAME` | `Unchained` | Shop name shown in the payment purpose |
| `PAYREXX_SUCCESS_PATH` | `/payrexx/success` | Path for successful payment redirect |
| `PAYREXX_ERROR_PATH` | `/payrexx/error` | Path for failed payment redirect |
| `PAYREXX_CANCEL_PATH` | `/payrexx/cancel` | Path for cancelled payment redirect |

## Create Provider

```graphql
mutation CreatePayrexxProvider {
  createPaymentProvider(
    paymentProvider: {
      type: GENERIC
      adapterKey: "shop.unchained.payment.payrexx"
    }
  ) {
    _id
  }
}

mutation ConfigurePayrexxProvider {
  updatePaymentProvider(
    paymentProviderId: "provider-id"
    paymentProvider: {
      configuration: [
        { key: "instance", value: "your-instance-name" }
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
| `instance` | Payrexx instance name (required — the provider is inactive without it) |

## Payment Flow

Follows the standard [checkout flow](./index.md#checkout-flow). Payrexx specifics:

`signPaymentProviderForCheckout(orderPaymentId: "...")` creates a Payrexx gateway and returns it as a JSON string:

```json
{
  "id": "gateway-id",
  "status": "waiting",
  "link": "https://instance.payrexx.com/pay?gateway=..."
}
```

Redirect the user to `link`. After payment, the user is redirected back to `EMAIL_WEBSITE_URL` + `PAYREXX_SUCCESS_PATH` / `PAYREXX_ERROR_PATH` / `PAYREXX_CANCEL_PATH`, and the webhook checks out the cart server-side. Fallback — checkout with the gateway id:

```graphql
mutation {
  checkoutCart(paymentContext: { gatewayId: "payrexx-gateway-id" }) {
    _id
    status
  }
}
```

## Pre-Authorization

Payrexx uses reservation mode: the payment is reserved (`reserved` status) at checkout, then captured on `confirmOrder` and released on `rejectOrder`:

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
| Key | `shop.unchained.payment.payrexx` |
| Type | `GENERIC` |
| Version | `1.0.0` |
| Source | [payment/payrexx/](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/payment/payrexx) |
