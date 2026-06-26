---
sidebar_position: 4
title: Payment Integration
sidebar_label: Payment Integration
description: Guide to integrating payment providers with Unchained Engine
---

# Payment Integration

This guide covers setting up payment processing in Unchained Engine, from configuring built-in providers to creating custom integrations.

## Overview

Unchained Engine supports multiple payment providers through the plugin system:

```mermaid
flowchart LR
    S[Storefront] <--> U[Unchained Engine<br/>PaymentDirector] <--> P[Payment Gateway<br/>Stripe, etc.]
```

## Built-in Payment Providers

| Provider | Type | Use Case |
|----------|------|----------|
| [Stripe](../plugins/payment/stripe.md) | GENERIC | Credit/debit cards |
| [Datatrans](../plugins/payment/datatrans.md) | GENERIC | Swiss payment gateway |
| [Saferpay](../plugins/payment/saferpay.md) | GENERIC | Swiss payment gateway |
| [Cryptopay](../plugins/payment/cryptopay.md) | GENERIC | Cryptocurrency |
| [Invoice](../plugins/payment/invoice.md) | INVOICE | Manual invoicing |

## Quick Start: Stripe

### 1. Install and Configure

```bash
npm install stripe
```

```typescript
// boot.ts
import '@unchainedshop/plugins/payment/stripe';
```

```bash
# .env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 2. Create Payment Provider

Create a payment provider in the Admin UI or via GraphQL:

```graphql
mutation CreateStripeProvider {
  createPaymentProvider(paymentProvider: {
    type: GENERIC
    adapterKey: "shop.unchained.payment.stripe"
  }) {
    _id
    type
    interface {
      _id
      label
    }
  }
}
```

### 3. Frontend Integration

```tsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_xxx');

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [signPayment] = useMutation(SIGN_PAYMENT);
  const [checkout] = useMutation(CHECKOUT);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get client secret from Unchained
    const { data } = await signPayment({
      variables: { orderPaymentId: cart.payment._id },
    });

    // Confirm payment with Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/complete`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setError(error.message);
    } else if (paymentIntent.status === 'succeeded') {
      // Complete checkout
      await checkout({
        variables: {
          paymentContext: { paymentIntentId: paymentIntent.id },
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>Pay</button>
    </form>
  );
}

function PaymentPage() {
  const { data } = useQuery(GET_CART);
  const clientSecret = data?.me?.cart?.payment?.clientSecret;

  if (!clientSecret) return <div>Loading...</div>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  );
}
```

### 4. Webhook Handler

```typescript
// api/webhooks/stripe.ts
import Stripe from 'stripe';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      // Payment successful - order will auto-confirm
      console.log('Payment succeeded:', event.data.object.id);
      break;
    case 'payment_intent.payment_failed':
      // Payment failed
      console.log('Payment failed:', event.data.object.id);
      break;
  }

  res.json({ received: true });
}
```

## Payment Flow

### Standard Flow

```mermaid
flowchart TD
    A[1. User selects payment provider] --> B[2. Initialize payment - get client token]
    B --> C[3. User completes payment on frontend]
    C --> D[4. Checkout order]
    D --> E[5. Webhook confirms payment]
    E --> F[Order CONFIRMED]
```

### GraphQL Mutations

```graphql
# Step 1: Set payment provider
mutation SetPaymentProvider($orderId: ID!, $paymentProviderId: ID!) {
  setOrderPaymentProvider(orderId: $orderId, paymentProviderId: $paymentProviderId) {
    _id
    payment {
      _id
      provider {
        _id
        interface {
          label
        }
      }
    }
  }
}

# Step 2: Sign payment (get client token)
mutation SignPayment($orderPaymentId: ID!) {
  signPaymentProviderForCheckout(orderPaymentId: $orderPaymentId)
}

# Step 4: Checkout
mutation Checkout($orderId: ID, $paymentContext: JSON) {
  checkoutCart(orderId: $orderId, paymentContext: $paymentContext) {
    _id
    status
    orderNumber
    payment {
      status
    }
  }
}
```

## Payment Provider Configuration

### Configure via Admin UI

1. Go to **Settings > Payment Providers**
2. Click **Create Provider**
3. Select adapter (e.g., Stripe)
4. Set configuration values
5. Save and activate

### Configure via GraphQL

```graphql
mutation ConfigureStripe {
  createPaymentProvider(paymentProvider: {
    type: GENERIC
    adapterKey: "shop.unchained.payment.stripe"
  }) {
    _id
  }
}
```

Configure `merchantCountry` via the Admin UI after creation.

### Environment Variables

Most payment adapters use environment variables:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_xxx
STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# PayPal
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_ENVIRONMENT=sandbox  # or production

# Datatrans
DATATRANS_MERCHANT_ID=xxx
DATATRANS_PASSWORD=xxx
DATATRANS_SIGN_KEY=xxx
```

## Custom Payment Adapter

Create a custom adapter for payment gateways not covered by built-in plugins:

```typescript
import {
  OrderPricingSheet,
  PaymentError,
  registerPaymentProvider,
} from '@unchainedshop/core';

registerPaymentProvider({
  adapterId: 'custom-gateway',
  type: 'GENERIC',
  configurationError: process.env.MY_GATEWAY_API_KEY
    ? null
    : PaymentError.INCOMPLETE_CONFIGURATION,

  // Create a payment session for the front-end SDK
  sign: async (configuration, context) => {
    if (!context.order) return null;
    const pricing = OrderPricingSheet({
      calculation: context.order.calculation,
      currencyCode: context.order.currencyCode,
    });
    const session = await myGateway.createSession({
      amount: pricing.total().amount,
      currency: context.order.currencyCode,
      orderId: context.order._id,
    });
    return session.clientToken;
  },

  // Confirm the charge (here, completed out of band and recorded on orderPayment.context)
  charge: async (configuration, context) => {
    const { transactionId } = context.orderPayment?.context || {};
    if (transactionId) {
      const payment = await myGateway.getPayment(transactionId);
      if (payment.status === 'completed') return { transactionId };
    }
    return false; // not complete yet → order stays PENDING
  },

  cancel: async (configuration, context) => {
    if (context.orderPayment?.transactionId) {
      await myGateway.refund(context.orderPayment.transactionId);
    }
    return true;
  },
});
```

## Testing Payments

### Test Mode

Most payment providers have test/sandbox modes:

```bash
# Stripe test keys
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# PayPal sandbox
PAYPAL_ENVIRONMENT=sandbox
```

### Test Card Numbers

| Provider | Card Number | Description |
|----------|-------------|-------------|
| Stripe | 4242 4242 4242 4242 | Successful payment |
| Stripe | 4000 0000 0000 0002 | Declined |
| Stripe | 4000 0025 0000 3155 | Requires 3DS |
| PayPal | N/A | Use sandbox accounts |

### Testing Webhooks Locally

Use Stripe CLI or ngrok for local webhook testing:

```bash
# Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# ngrok
ngrok http 3000
# Configure webhook URL in Stripe dashboard
```

## Error Handling

### Common Payment Errors

| Error | Cause | User Message |
|-------|-------|--------------|
| `card_declined` | Card was declined | "Your card was declined" |
| `insufficient_funds` | Not enough funds | "Insufficient funds" |
| `expired_card` | Card expired | "Card has expired" |
| `incorrect_cvc` | Wrong CVC | "Invalid security code" |
| `processing_error` | Gateway error | "Please try again" |

### Error Handling in Frontend

```typescript
try {
  const { error } = await stripe.confirmPayment({ /* ... */ });
  if (error) {
    switch (error.code) {
      case 'card_declined':
        setError('Your card was declined. Please try another card.');
        break;
      case 'expired_card':
        setError('Your card has expired. Please use a different card.');
        break;
      default:
        setError('Payment failed. Please try again.');
    }
  }
} catch (err) {
  setError('An unexpected error occurred.');
}
```

## Payment Fees

Add payment processing fees to orders:

```typescript
import { OrderPricingSheet, registerPaymentPricing } from '@unchainedshop/core';

registerPaymentPricing({
  adapterId: 'card-fee',
  isActivatedFor: (context) =>
    context.provider.adapterKey === 'shop.unchained.payment.stripe',
  calculate: async (sheet, context) => {
    const pricing = OrderPricingSheet({
      calculation: context.order?.calculation,
      currencyCode: context.order?.currencyCode,
    });
    const total = pricing.total().amount;
    sheet.addFee({ amount: Math.round(total * 0.029 + 30), isTaxable: false, isNetPrice: true }); // 2.9% + 0.30
  },
});
```

## Multi-Currency Support

Handle multiple currencies:

```typescript
import { OrderPricingSheet } from '@unchainedshop/core';

async function createCheckoutSession(order) {
  const pricing = OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
  });
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: order.currencyCode.toLowerCase(),
        product_data: { name: `Order ${order.orderNumber}` },
        unit_amount: pricing.total().amount,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.ROOT_URL}/checkout/success`,
    cancel_url: `${process.env.ROOT_URL}/checkout/cancel`,
  });

  return session.id;
}
```

## Related

- [Stripe Plugin](../plugins/payment/stripe.md) - Stripe payment adapter
- [Director/Adapter Pattern](../concepts/director-adapter-pattern.md) - Plugin architecture
- [Checkout Implementation](./checkout-implementation.md) - Full checkout flow
