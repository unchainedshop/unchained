---
sidebar_position: 12
title: Stripe
sidebar_label: Stripe
description: Payment processing with Stripe payment intents and saved payment methods
---

# Stripe

Payment plugin for [Stripe](https://stripe.com/docs/api), based on [Payment Intents](https://stripe.com/docs/payments/payment-intents) and [Setup Intents](https://stripe.com/docs/payments/setup-intents) (SCA-compliant, supports saved payment methods).

## Installation

Included in the [`all` preset](../../platform-configuration/plugin-presets.md) — `registerAllPlugins()` registers the plugin together with its webhook route.

To register it individually:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { StripePlugin } from '@unchainedshop/plugins/payment/stripe';

pluginRegistry.register(StripePlugin);
```

Register before `startPlatform()`. Registration mounts the webhook route `POST /payment/stripe/webhook` (path configurable via `STRIPE_WEBHOOK_PATH`) on the Unchained HTTP server — no manual Express/Fastify wiring. Registration throws if `STRIPE_SECRET` is not set and warns if `STRIPE_ENDPOINT_SECRET` is missing.

The `stripe` npm package is an optional peer dependency:

```bash
npm install stripe
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STRIPE_SECRET` | - | Stripe secret key (required, registration throws without it) |
| `STRIPE_ENDPOINT_SECRET` | - | Webhook signing secret for signature verification (required for webhooks) |
| `STRIPE_WEBHOOK_PATH` | `/payment/stripe/webhook` | Webhook endpoint path |
| `STRIPE_WEBHOOK_ENVIRONMENT` | - | Environment tag stored in intent metadata; webhooks for other environments are skipped (multi-environment setups) |
| `EMAIL_WEBSITE_NAME` | `Unchained` | Fallback description on payment/setup intents |

## Create Provider

```graphql
mutation CreateStripeProvider {
  createPaymentProvider(
    paymentProvider: {
      type: GENERIC
      adapterKey: "shop.unchained.payment.stripe"
    }
  ) {
    _id
  }
}
```

Provider configuration (via `updatePaymentProvider`):

| Key | Description |
|-----|-------------|
| `descriptorPrefix` | Custom prefix for statement descriptors (optional) |

## Configure Stripe Dashboard

1. Go to **Developers** > **Webhooks**
2. Add endpoint: `https://your-domain.com/payment/stripe/webhook`
3. Select events `payment_intent.succeeded` and `setup_intent.succeeded`
4. Copy the signing secret to `STRIPE_ENDPOINT_SECRET`

## Payment Flow

Follows the standard [checkout flow](./index.md#checkout-flow). Stripe specifics:

1. `signPaymentProviderForCheckout(orderPaymentId: "...")` creates a payment intent and returns its client secret.
2. Confirm the payment client-side with [Stripe.js](https://docs.stripe.com/js) (`stripe.confirmPayment({ clientSecret, ... })`).
3. On `payment_intent.succeeded`, the webhook checks out the cart server-side.
4. Fallback — checkout with the payment intent id:

```graphql
mutation {
  checkoutCart(paymentContext: { paymentIntentId: "pi_..." }) {
    _id
    status
  }
}
```

The plugin validates that amount, currency, and `orderPaymentId` metadata of the payment intent match the order payment.

## Saved Payment Methods

1. Create a setup intent:

```graphql
mutation {
  signPaymentProviderForCredentialRegistration(
    paymentProviderId: "stripe-provider-id"
  )
}
```

2. Confirm it client-side with `stripe.confirmSetup({ clientSecret, ... })`.

3. On `setup_intent.succeeded`, the webhook registers the credentials — or register manually:

```graphql
mutation {
  registerPaymentCredentials(
    paymentProviderId: "stripe-provider-id"
    transactionContext: { setupIntentId: "seti_..." }
  ) {
    _id
  }
}
```

4. Checkout with the saved payment method:

```graphql
mutation {
  checkoutCart(
    paymentContext: {
      paymentCredentials: {
        token: "pm_stripe_payment_method_id"
        meta: {
          customer: "cus_stripe_customer_id"
          payment_method_types: ["card"]
        }
      }
    }
  ) {
    _id
    status
  }
}
```

The plugin creates and reuses Stripe customers automatically, deduplicated by `metadata["userId"]`.

## Testing

Forward webhooks to your local server with the [Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
stripe listen --forward-to http://localhost:4010/payment/stripe/webhook
```

Test card numbers: see [Stripe testing docs](https://docs.stripe.com/testing).

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.payment.stripe` |
| Type | `GENERIC` |
| Version | `2.0.0` |
| Source | [payment/stripe/](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/payment/stripe) |
