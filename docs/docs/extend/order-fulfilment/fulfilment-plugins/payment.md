---
sidebar_position: 8
sidebar_label: Payment
title: Write a Payment Provider Plugin
---

# Payment Provider Plugins

Payment adapters handle payment processing for orders. Unchained supports multiple payment types (`CARD`, `INVOICE`, `GENERIC`) and you can implement custom adapters for any payment gateway.

For an overview of how payment fits into the order lifecycle, see [Order Lifecycle](../../../concepts/order-lifecycle).

## Payment Types

| Type | Description | Use Cases |
|------|-------------|-----------|
| `CARD` | Credit/debit card payments | Stripe, PayPal, Braintree |
| `INVOICE` | Invoice-based payments | Pre-paid or post-paid invoices |
| `GENERIC` | Other payment methods | Crypto, bank transfer, cash |

## Creating a Payment Adapter

Implement the `IPaymentAdapter` interface and register it with the `PaymentDirector`.

### Example: Pre-Paid Invoice

This example shows a pre-paid invoice provider that blocks order confirmation until payment is received:

```typescript
import {
  PaymentDirector,
  type IPaymentAdapter,
  type PaymentChargeActionResult,
} from '@unchainedshop/core';

const PrePaidInvoice: IPaymentAdapter = {
  key: 'shop.example.payment.prepaid-invoice',
  label: 'Pre-Paid Invoice',
  version: '1.0.0',

  // Initial configuration (optional)
  initialConfiguration: [],

  // Which payment types this adapter supports
  typeSupported(type) {
    return type === 'INVOICE';
  },

  actions(params) {
    const { context, paymentContext } = params;
    const { order } = paymentContext;
    const { modules } = context;

    return {
      // Return configuration errors (e.g., missing API keys)
      configurationError() {
        return null;
      },

      // Is this adapter active for the current context?
      isActive() {
        return true;
      },

      // Can the order be confirmed before payment?
      // false = payment must complete first (pre-paid)
      // true = order can proceed without payment (post-paid)
      isPayLaterAllowed() {
        return false;
      },

      // Process payment charge
      async charge(): Promise<PaymentChargeActionResult | false> {
        // For pre-paid invoice:
        // - Return false: payment not yet received, stay in PENDING
        // - Return { transactionId }: payment received, proceed
        // - Throw error: abort checkout entirely
        return false;
      },

      // Register a payment method (e.g., save card for future use)
      async register() {
        return { token: '' };
      },

      // Sign a payment request (e.g., for client-side SDK initialization)
      async sign() {
        return '';
      },

      // Validate a payment token
      async validate(token) {
        return true;
      },

      // Cancel/refund payment
      async cancel() {
        return true;
      },

      // Confirm a previously authorized payment
      async confirm() {
        return { transactionId: '' };
      },
    };
  },
};

// Register the adapter
PaymentDirector.registerAdapter(PrePaidInvoice);
```

## Adapter Methods Reference

### `typeSupported(type)`

Determines which payment types this adapter handles.

```typescript
typeSupported(type) {
  return type === 'CARD';
}
```

### `configurationError()`

Return any configuration errors. Called when validating the provider setup.

```typescript
configurationError() {
  if (!process.env.PAYMENT_API_KEY) {
    return { code: 'MISSING_API_KEY', message: 'Payment API key is required' };
  }
  return null;
}
```

### `isActive()`

Determines if the adapter is active for the current transaction context.

```typescript
isActive() {
  // Disable for specific countries
  const { order } = this.paymentContext;
  return order.countryCode !== 'BLOCKED_COUNTRY';
}
```

### `isPayLaterAllowed()`

Controls whether order confirmation can proceed before payment completes.

| Return Value | Behavior |
|--------------|----------|
| `true` | Order can be confirmed without payment (post-paid) |
| `false` | Payment must complete before order confirmation (pre-paid) |

```typescript
isPayLaterAllowed() {
  // Post-paid invoice: allow order to proceed
  return true;
}
```

### `charge()`

Process the payment charge. This is called during checkout.

| Return Value | Behavior |
|--------------|----------|
| `{ transactionId }` | Payment successful, proceed with checkout |
| `false` | Payment not complete yet, order stays in PENDING |
| Throws error | Abort checkout, order stays in OPEN (cart) |

```typescript
async charge() {
  try {
    const result = await paymentGateway.charge({
      amount: order.pricing().total().amount,
      currency: order.currency,
    });
    return { transactionId: result.id };
  } catch (error) {
    // Throw to abort checkout
    throw new Error('Payment failed: ' + error.message);
  }
}
```

### `register()`

Register a payment method for future use (e.g., save a credit card).

```typescript
async register() {
  const token = await paymentGateway.createCustomer(user);
  return { token };
}
```

### `sign()`

Sign a payment request for client-side SDK initialization.

```typescript
async sign() {
  // Create a client token for Stripe Elements, PayPal buttons, etc.
  const clientSecret = await paymentGateway.createPaymentIntent({
    amount: order.pricing().total().amount,
  });
  return clientSecret;
}
```

### `validate(token)`

Validate a payment token.

```typescript
async validate(token) {
  const isValid = await paymentGateway.validateToken(token);
  return isValid;
}
```

### `cancel()`

Cancel or refund a payment. Called when an order is rejected.

```typescript
async cancel() {
  const { orderPayment } = this.paymentContext;
  if (orderPayment.transactionId) {
    await paymentGateway.refund(orderPayment.transactionId);
  }
  return true;
}
```

### `confirm()`

Confirm a previously authorized payment. Called when order transitions to CONFIRMED.

```typescript
async confirm() {
  const { orderPayment } = this.paymentContext;
  const result = await paymentGateway.capturePayment(orderPayment.transactionId);
  return { transactionId: result.id };
}
```

## Webhook Integration

Most payment gateways require webhooks for async payment confirmations. Create an endpoint to handle these:

```typescript
import express from 'express';

const app = express();

app.post('/webhooks/payment', async (req, res) => {
  const event = req.body;

  if (event.type === 'payment_intent.succeeded') {
    const { orderId } = event.data.metadata;

    // Confirm the order
    await modules.orders.checkout(orderId, {
      transactionId: event.data.id,
    });
  }

  res.json({ received: true });
});
```

## Example: Card Payment with Stripe

```typescript
import Stripe from 'stripe';
import { PaymentDirector, type IPaymentAdapter } from '@unchainedshop/core';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const StripePayment: IPaymentAdapter = {
  key: 'shop.example.payment.stripe',
  label: 'Stripe Card Payment',
  version: '1.0.0',

  typeSupported(type) {
    return type === 'CARD';
  },

  actions(params) {
    const { paymentContext } = params;
    const { order, orderPayment } = paymentContext;

    return {
      configurationError() {
        if (!process.env.STRIPE_SECRET_KEY) {
          return { code: 'STRIPE_KEY_MISSING' };
        }
        return null;
      },

      isActive() {
        return true;
      },

      isPayLaterAllowed() {
        return false;
      },

      async sign() {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: order.pricing().total().amount,
          currency: order.currency.toLowerCase(),
          metadata: { orderId: order._id },
        });
        return paymentIntent.client_secret;
      },

      async charge() {
        // Payment is confirmed via webhook
        if (orderPayment.context?.paymentIntentId) {
          const intent = await stripe.paymentIntents.retrieve(
            orderPayment.context.paymentIntentId
          );
          if (intent.status === 'succeeded') {
            return { transactionId: intent.id };
          }
        }
        return false;
      },

      async cancel() {
        if (orderPayment.transactionId) {
          await stripe.refunds.create({
            payment_intent: orderPayment.transactionId,
          });
        }
        return true;
      },

      async confirm() {
        return { transactionId: orderPayment.transactionId };
      },

      async register() {
        return { token: '' };
      },

      async validate() {
        return true;
      },
    };
  },
};

PaymentDirector.registerAdapter(StripePayment);
```

## Related

- [Director/Adapter Pattern](../../../concepts/director-adapter-pattern) - Understanding the plugin architecture
- [Order Lifecycle](../../../concepts/order-lifecycle) - How payment fits into checkout
- [Stripe Plugin](../../../plugins/payment/stripe) - Stripe payment adapter
