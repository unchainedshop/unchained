---
sidebar_position: 4
title: PostFinance Checkout
sidebar_label: PostFinance
description: Swiss PostFinance payment service integration
---

# PostFinance Checkout

The Unchained plugin implements the PostFinance Checkout payment service with support for all payment methods, different integration modes (payment page, lightbox, and iFrame), deferred settlements, and refunds.

- [PostFinance Checkout Documentation](https://checkout.postfinance.ch/de-ch/doc/api/web-service)
- [PostFinance Checkout Integration Guide](https://checkout.postfinance.ch/de-ch/doc/payment-integration)

## Installation

**Express:**
```typescript
import express from 'express';
import '@unchainedshop/plugins/payment/postfinance-checkout';
import { postfinanceCheckoutHandler } from '@unchainedshop/plugins/payment/postfinance-checkout/handler-express';

const { PFCHECKOUT_WEBHOOK_PATH = '/payment/postfinance-checkout' } = process.env;

app.use(PFCHECKOUT_WEBHOOK_PATH, express.json(), postfinanceCheckoutHandler);
```

**Fastify:**
```typescript
import '@unchainedshop/plugins/payment/postfinance-checkout';
import { postfinanceCheckoutHandler } from '@unchainedshop/plugins/payment/postfinance-checkout/handler-fastify';

const { PFCHECKOUT_WEBHOOK_PATH = '/payment/postfinance-checkout' } = process.env;

fastify.route({
  url: PFCHECKOUT_WEBHOOK_PATH,
  method: 'POST',
  handler: postfinanceCheckoutHandler,
});
```

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

mutation ConfigurePostFinanceProvider {
  updatePaymentProvider(
    paymentProviderId: "provider-id"
    paymentProvider: {
      configuration: [
        { key: "completionMode", value: "Immediate" }
      ]
    }
  ) {
    _id
  }
}
```

## Configure PostFinance Checkout Webhooks

Configure the [webhooks](https://checkout.postfinance.ch/space/select?target=/webhook/listener/list) in the PostFinance Checkout web interface for:
- Accepted payments ("Verbuchung der Transaktion" → "Erfolgreich")
- Failed payments ("Verbuchung der Transaktion" → "Fehlgeschlagen")

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PFCHECKOUT_SPACE_ID` | - | PostFinance Checkout space ID (required) |
| `PFCHECKOUT_USER_ID` | - | PostFinance API user ID (required) |
| `PFCHECKOUT_SECRET` | - | PostFinance API secret (required) |
| `PFCHECKOUT_WEBHOOK_PATH` | `/payment/postfinance-checkout` | Webhook endpoint path |
| `PFCHECKOUT_SUCCESS_URL` | - | URL for successful payment redirect (appends `?order_id=<id>`) |
| `PFCHECKOUT_FAILED_URL` | - | URL for failed payment redirect (appends `?order_id=<id>`) |

## Provider Configuration

| Key | Description |
|-----|-------------|
| `completionMode` | `Immediate` (default) or `Deferred` for pre-authorization |

# Usage

To start a new PostFinance Checkout transaction, the mutation `signPaymentProviderForCheckout` is used. The plugin accepts two parameters in the `transactionContext` which control the behavior of the transaction: `integrationMode` and `completionMode`.

## Integration Mode
You can specify the integration mode in the `transactionContext` of `signPaymentProviderForCheckout` with the parameter `integrationMode`. Valid values are `PaymentPage` (default value if nothing is specified), `Lightbox`, or `iFrame`:
```/*graphql*/
signPaymentProviderForCheckout(
    orderPaymentId: "order payment id of the cart you want to checkout",
    transactionContext: {integrationMode: "Lightbox"}
)
```

*To get the order payment id of the current active cart of the logged in user you can*
```/*graphql*/
me {
    cart {
        payment {
            _id
        }
    }
} 
```

The mutation returns a stringified JSON object with the transaction ID and the location:
```json
{
    "transactionId": 424242,
    "location": "https://checkout.postfinance.ch/s/25563/payment/transaction/pay/424242?securityToken=<token>"
}
```
Depending on the `integrationMode`, `location` needs to be handled differently at the client side. For `PaymentPage` (as in the example above), it contains the URL that the user should be redirected to. For `Lightbox` and `iFrame`, it contains the JavaScript-URL, e.g. `https://checkout.postfinance.ch/assets/payment/lightbox-checkout-handler.js?spaceId=25563&transactionId=424242&securityToken=<token>`.
*Note that although the URL always follows the same schema (and therefore could be constructed from the space ID, transaction ID, and security token), it is fetched from a PostFinance API endpoint and the schema could in theory change.*

After the successful payment, the web hook will be called and the order will be marked as paid.
If the web hook was not called for some reason or a different error happened during the processing, you can also manually call `checkoutCart` and the system will check if the transaction was paid:

```/*graphql*/
checkoutCart(
    orderId: "order id from query parameter" ) { 
    _id, 
    status
}
```

This gives Unchained Engine a (second) chance to process and settle the payment.

## Completion Mode
The completion mode that is configured when instantiating a provider (see above for details) determines if transactions are completed immediately (default behavior if nothing is specified explicitly, value `Immediate`) or if only a reservation is created (`Deferred`) that can be voided / completed later.
*Note that not all payment methods support deferred settlements. Alternatively, you can also use refunds.*

When you use deferred completion, it's your responsibility to confirm the order (e.g., in an ERP system that handles the payment flows).

## Cancellation / Refunds

An order payment can be cancelled in two cases:
1. A transaction was started with deferred settlement (i.e., only a reservation was created) and it should not be completed.
2. A transaction completed successfully, but there should be a refund to the user for some reason.

In both cases, this is initiated when the order is rejected via `rejectOrder`.

## Saved Payment Methods

The tokenization mode is set to `ALLOW_ONE_CLICK_PAYMENT` and the Unchained customer ID is passed to the PostFinance API.
This gives the user the option to save a payment method. When he does this and orders for a second time, the saved method can be directly selected.

# Testing

For testing purposes, you can create a dedicated space in the PostFinance Checkout web interface and set it to testing mode.
In this mode, transactions can be paid with test payment methods that appear in the web interface.
`PFCHECKOUT_SPACE_ID` needs to be set to the id of this space (for unit tests or when running end user tests on a dev / staging environment).

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.payment.postfinance-checkout` |
| Type | `GENERIC` |
| Source | [payment/postfinance-checkout/](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/payment/postfinance-checkout/) |

## Related

- [Plugins Overview](./) - All available plugins
- [Payment Integration Guide](../../guides/payment-integration.md) - Payment setup guide
- [Checkout Implementation](../../guides/checkout-implementation.md) - Complete checkout flow