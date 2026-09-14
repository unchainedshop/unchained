---
sidebar_position: 8
sidebar_label: Payment
title: Write a Payment Provider Plugin
---

# Payment Provider Plugins

Payment adapters process order payments and expose provider-specific signing,
registration, and validation operations. See [Order Lifecycle](../../../concepts/order-lifecycle)
for how payment and delivery determine order status.

## Payment Types

| Type | Description | Examples |
|------|-------------|----------|
| `INVOICE` | Invoice-based payments | Pre-paid and post-paid invoices |
| `GENERIC` | Payments with provider-specific context | Stripe, PayPal, Braintree, cryptocurrency |

There is no `CARD` provider type. Card integrations use `GENERIC`.

## Creating a Payment Adapter

Implement `IPaymentAdapter`, inherit the base defaults, and register the object
with `PaymentDirector`. The factory receives two arguments:
`actions(configuration, context)`. The context contains `modules` and
`paymentProvider`, plus optional `order`, `orderPayment`, `userId`, and transaction
data. Configuration checks can run without an order, so guard order-specific access.

### Example: Pre-Paid Invoice

This adapter leaves the payment unpaid during checkout and disables automatic
confirmation before payment. It follows the built-in invoice-prepaid adapter:

```typescript
import { PaymentAdapter, PaymentDirector, type IPaymentAdapter } from '@unchainedshop/core';
import { PaymentProviderType } from '@unchainedshop/core-payment';

const PrePaidInvoice: IPaymentAdapter = {
  ...PaymentAdapter,
  key: 'shop.example.payment.prepaid-invoice',
  label: 'Pre-Paid Invoice',
  version: '1.0.0',
  initialConfiguration: [],

  typeSupported: (type) => type === PaymentProviderType.INVOICE,

  actions: (configuration, context) => ({
    ...PaymentAdapter.actions(configuration, context),
    configurationError: () => null,
    isActive: () => true,
    isPayLaterAllowed: () => false,
    charge: async () => false,
  }),
};

PaymentDirector.registerAdapter(PrePaidInvoice);
```

Use a provider integration or authorized administrative workflow to record the
later payment. Returning `false` from `charge` does not schedule a payment retry.

## Action Contracts

| Action | Return value | Purpose |
|--------|--------------|---------|
| `configurationError(transactionContext?)` | `PaymentError` or `null` | Report a configuration problem using the exported error constants |
| `isActive(transactionContext?)` | `boolean` | Whether the adapter can be used in the current context |
| `isPayLaterAllowed(transactionContext?)` | `boolean` | Whether automatic confirmation may proceed while payment is unpaid |
| `charge(transactionContext?)` | Promise of a result object or `false` | Attempt payment; the director marks an object result as paid |
| `register(transactionContext?)` | Promise of provider-specific data | Register reusable payment credentials |
| `sign(transactionContext?)` | Promise of a string or `null` | Generate client initialization data |
| `validate(token?)` | Promise of a boolean | Validate provider-specific credential data |
| `cancel(transactionContext?)` | Promise of a boolean | Cancel a payment through the provider |
| `confirm(transactionContext?)` | Promise of a boolean | Confirm a payment through the provider |

`PaymentError.INCOMPLETE_CONFIGURATION`, for example, is a string constant,
not an object with `code` and `message`. A charge result may contain a
`transactionId`, provider data, and optional `credentials`. The director stores
`transactionId` on the order payment and records other response data in its status log.
`cancel` and `confirm` return booleans, not charge-result objects. Implement their
provider-specific behavior; the base defaults return `false`.

The director passes transaction data as the action argument. It is not a
`this.paymentContext` field. The optional `order` and `orderPayment` are available
from the factory's context closure.

### Charge Outcomes

| Outcome | Effect |
|---------|--------|
| Result object | The payment is marked paid; order processing continues |
| `false` | The payment status is unchanged; order status depends on payment and delivery rules |
| Thrown error | The current operation rejects; already completed external effects are not automatically rolled back |

An unpaid pre-paid order normally remains `PENDING`. Allowing payment later does
not alone guarantee confirmation: delivery must also permit automatic release.

## Reading the Order Total

Orders are plain data records. Build an `OrderPricingSheet` from their calculation
and `currencyCode` to read the total:

```typescript
import { OrderPricingSheet } from '@unchainedshop/core';
import type { Order } from '@unchainedshop/core-orders';

function paymentAmount(order: Order) {
  const pricing = OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
  });
  return pricing.total({ useNetPrice: false });
}
```

Amounts use the currency's minor units. Apply the gateway's currency and amount
formatting at the provider boundary.

## Stripe and Webhooks

To use the bundled Stripe adapter, import it and configure a `GENERIC` provider
with adapter key `shop.unchained.payment.stripe`:

```typescript
import '@unchainedshop/plugins/payment/stripe/index.js';
```

Set `STRIPE_SECRET` for API calls and `STRIPE_ENDPOINT_SECRET` for webhook
verification. The default Express/Fastify plugin middleware presets mount the
Stripe webhook route. Follow the [Stripe plugin guide](../../../plugins/payment/stripe)
for setup and the supported client flow.

The bundled webhook handlers verify the signature against the raw request body,
resolve the payment using `orderPaymentId` metadata, and pass the payment intent
to `services.orders.checkoutOrder(orderPayment.orderId, {
  paymentContext: { paymentIntentId }
})`. This is a core service, not `modules.orders.checkout`. The adapter verifies
the intent's amount, currency, and payment association before accepting it.

For a custom gateway, implement its verification and payment-state handling in
your route. Preserve the raw body when required for signature verification and
make repeated webhook delivery safe for the operations you invoke.

## Related

- [Director/Adapter Pattern](../../../concepts/director-adapter-pattern)
- [Order Lifecycle](../../../concepts/order-lifecycle)
- [Stripe Plugin](../../../plugins/payment/stripe)
