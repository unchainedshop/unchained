---
sidebar_position: 12
title: Stripe
sidebar_label: Stripe
description: Payment processing with Stripe payment intents and saved payment methods
---

# Stripe

Unchained payment plugin for Stripe, supporting payment intents, saved payment methods, and comprehensive payment processing with SCA compliance.

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Payment Intents](https://stripe.com/docs/payments/payment-intents)
- [Stripe Setup Intents](https://stripe.com/docs/payments/setup-intents)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

## Installation

**Express:**
```typescript
import express from 'express';
import '@unchainedshop/plugins/payment/stripe';
import { stripeHandler } from '@unchainedshop/plugins/payment/stripe/handler-express';

const { STRIPE_WEBHOOK_PATH = '/payment/stripe' } = process.env;

// IMPORTANT: Use raw body for Stripe signature verification
app.use(STRIPE_WEBHOOK_PATH, express.raw({ type: 'application/json' }), stripeHandler);
```

**Fastify:**
```typescript
import '@unchainedshop/plugins/payment/stripe';
import { stripeHandler } from '@unchainedshop/plugins/payment/stripe/handler-fastify';

const { STRIPE_WEBHOOK_PATH = '/payment/stripe' } = process.env;

fastify.register((s, opts, registered) => {
  s.addContentTypeParser(
    'application/json',
    { parseAs: 'string', bodyLimit: 1024 * 1024 },
    s.defaultTextParser,
  );
  s.route({
    url: STRIPE_WEBHOOK_PATH,
    method: 'POST',
    handler: stripeHandler,
  });
  registered();
});
```

Requires the `stripe` npm package as a peer dependency:

```bash
npm install stripe
```

## Create Provider

```graphql
mutation CreateStripeProvider {
  createPaymentProvider(
    paymentProvider: {
      type: GENERIC
      adapterKey: "shop.unchained.payment.stripe"
      configuration: [
        { key: "descriptorPrefix", value: "MYSHOP" }
      ]
    }
  ) {
    _id
  }
}
```

## Configure Stripe Dashboard

1. Go to **Developers** > **Webhooks**
2. Add endpoint: `https://your-domain.com/payment/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `setup_intent.succeeded`
4. Copy the signing secret to `STRIPE_ENDPOINT_SECRET`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STRIPE_SECRET` | - | Your Stripe secret key (required) |
| `STRIPE_ENDPOINT_SECRET` | - | Webhook endpoint secret for signature verification |
| `STRIPE_WEBHOOK_PATH` | `/payment/stripe` | Webhook endpoint path |
| `STRIPE_WEBHOOK_ENVIRONMENT` | - | Environment tag for filtering webhooks (optional) |
| `EMAIL_WEBSITE_NAME` | `Unchained` | Description shown on payment intents |

## Provider Configuration

| Key | Description |
|-----|-------------|
| `descriptorPrefix` | Custom prefix for statement descriptors (optional) |

## Payment Flow

### 1. Sign for Checkout

Create a payment intent:

```graphql
mutation SignPayment {
  signPaymentProviderForCheckout(orderPaymentId: "order-payment-id")
}
```

Returns a client secret for the payment intent.

### 2. Collect Payment (Frontend)

Use Stripe.js to collect payment:

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_...');
const clientSecret = signResult; // From step 1

const { error, paymentIntent } = await stripe.confirmPayment({
  clientSecret,
  confirmParams: {
    return_url: 'https://shop.example.com/checkout/complete',
  },
});

if (error) {
  console.error(error.message);
} else if (paymentIntent.status === 'succeeded') {
  // Payment successful
}
```

### 3. Complete via Webhook (Recommended)

The webhook automatically completes checkout when payment succeeds:

```typescript
// Webhook handler calls internally:
await services.orders.checkoutOrder(orderId, {
  paymentContext: { paymentIntentId: 'pi_...' }
});
```

### 4. Manual Checkout (Alternative)

Complete checkout with the payment intent ID:

```graphql
mutation CheckoutWithStripe {
  checkoutCart(
    paymentContext: {
      paymentIntentId: "pi_stripe_payment_intent_id"
    }
  ) {
    _id
    status
    orderNumber
  }
}
```

## Saved Payment Methods

### Register a Payment Method

1. Create a setup intent:

```graphql
mutation SignForRegistration {
  signPaymentProviderForCredentialRegistration(
    paymentProviderId: "stripe-provider-id"
  )
}
```

2. Collect payment method with Stripe.js:

```typescript
const { error, setupIntent } = await stripe.confirmSetup({
  clientSecret: signResult,
  confirmParams: {
    return_url: 'https://shop.example.com/account/payment-methods',
  },
});
```

3. The webhook automatically registers the payment method, or register manually:

```graphql
mutation RegisterPaymentMethod {
  registerPaymentCredentials(
    paymentProviderId: "stripe-provider-id"
    transactionContext: {
      setupIntentId: "seti_stripe_setup_intent_id"
    }
  ) {
    _id
  }
}
```

### Use Saved Payment Method

```graphql
mutation CheckoutWithSaved {
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

## Environment Filtering

Use `STRIPE_WEBHOOK_ENVIRONMENT` to filter webhooks in multi-environment setups:

```bash
# Production
STRIPE_WEBHOOK_ENVIRONMENT=production

# Staging
STRIPE_WEBHOOK_ENVIRONMENT=staging
```

The environment is stored in payment intent metadata and verified in webhook processing.

## Customer Management

The plugin automatically creates and manages Stripe customers:
- Customers are created/updated on first payment
- Customer ID is stored in payment intent metadata
- Customer search uses `metadata["userId"]` for deduplication

## Webhook Events

| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Complete checkout |
| `setup_intent.succeeded` | Register payment credentials |

## Testing

### Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login --api-key sk_test_...

# Forward webhooks to local server
stripe listen --forward-to http://localhost:4010/payment/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
```

### Test Cards

| Card Number | Result |
|-------------|--------|
| `4242424242424242` | Succeeds |
| `4000000000000002` | Declined |
| `4000002500003155` | Requires 3D Secure |

## Validation

The plugin validates:
- Amount matches order total
- Currency matches order currency
- `orderPaymentId` in metadata matches the order payment

## Features

- Payment Intents API with SCA compliance
- Saved payment methods via Setup Intents
- Automatic customer management
- Statement descriptor customization
- Multi-environment webhook support
- Off-session payments

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.payment.stripe` |
| Type | `GENERIC` |
| Version | `2.0.0` |
| Source | [payment/stripe/](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/payment/stripe/) |

## Related

- [Plugins Overview](./) - All available plugins
- [Payment Integration Guide](../../guides/payment-integration.md) - Payment setup guide
- [Checkout Implementation](../../guides/checkout-implementation.md) - Complete checkout flow
