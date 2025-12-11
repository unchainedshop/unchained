---
sidebar_position: 2
title: Datatrans
sidebar_label: Datatrans
description: Swiss payment service provider with multiple payment methods
---

# Datatrans

Unchained payment plugin for Datatrans, a Swiss payment service provider supporting multiple payment methods.

- [Datatrans API Documentation](https://docs.datatrans.ch/docs/home)
- [Datatrans Payment Process](https://docs.datatrans.ch/docs/payment-process-overview)
- [Datatrans Webhooks](https://docs.datatrans.ch/docs/webhook)

## Installation

**Express:**
```typescript
import express from 'express';
import '@unchainedshop/plugins/payment/datatrans-v2';
import { datatransHandler } from '@unchainedshop/plugins/payment/datatrans-v2/handler-express';

const { DATATRANS_WEBHOOK_PATH = '/payment/datatrans/webhook' } = process.env;

// IMPORTANT: Use express.text for Datatrans signature verification
app.use(DATATRANS_WEBHOOK_PATH, express.text({ type: 'application/json' }), datatransHandler);
```

**Fastify:**
```typescript
import '@unchainedshop/plugins/payment/datatrans-v2';
import { datatransHandler } from '@unchainedshop/plugins/payment/datatrans-v2/handler-fastify';

const { DATATRANS_WEBHOOK_PATH = '/payment/datatrans/webhook' } = process.env;

fastify.register((s, opts, registered) => {
  s.addContentTypeParser(
    'application/json',
    { parseAs: 'string', bodyLimit: 1024 * 1024 },
    s.defaultTextParser,
  );
  s.route({
    url: DATATRANS_WEBHOOK_PATH,
    method: 'POST',
    handler: datatransHandler,
  });
  registered();
});
```

## Create Provider

```graphql
mutation CreateDatatransProvider {
  createPaymentProvider(
    paymentProvider: {
      type: GENERIC
      adapterKey: "shop.unchained.payment.datatrans"
      configuration: [
        { key: "merchantId", value: "your-merchant-id" }
      ]
    }
  ) {
    _id
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATATRANS_SECRET` | - | API secret (required) |
| `DATATRANS_SIGN_KEY` | - | Signing key (required) |
| `DATATRANS_SIGN2_KEY` | `{DATATRANS_SIGN_KEY}` | Secondary signing key |
| `DATATRANS_SECURITY` | `dynamic-sign` | `''`, `'static-sign'`, `'dynamic-sign'` |
| `DATATRANS_API_ENDPOINT` | `https://api.sandbox.datatrans.com` | API endpoint (use non-sandbox for production) |
| `DATATRANS_WEBHOOK_PATH` | `/payment/datatrans/webhook` | Webhook endpoint path |
| `DATATRANS_SUCCESS_PATH` | `/payment/datatrans/success` | Success redirect path |
| `DATATRANS_ERROR_PATH` | `/payment/datatrans/error` | Error redirect path |
| `DATATRANS_CANCEL_PATH` | `/payment/datatrans/cancel` | Cancel redirect path |
| `DATATRANS_RETURN_PATH` | `/payment/datatrans/return` | Return redirect path |
| `DATATRANS_MERCHANT_ID` | - | Default merchant ID (fallback if not set in provider config) |

## Provider Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `merchantId` | - | Datatrans merchant ID (required) |
| `settleInUnchained` | `1` | Enable settlement in Unchained (`"1"` or `""`) |
| `marketplaceSplit` | - | Marketplace split config: `"SUBMERCHANTID;DISCOUNT_ADAPTER_KEY;SHARE_PERCENTAGE"` |

### Marketplace Integration

Unchained supports Datatrans Marketplace payments. See [Datatrans Marketplace docs](https://docs.datatrans.ch/docs/marketplace-payments#section-settlement-splits) for details.

- Add multiple `marketplaceSplit` entries for multi-merchant splits
- `settleInUnchained` must be `1` for marketplace features
- The marketplace feature requires a custom discount adapter to pre-calculate commissions

# Usage in the Frontend

You can easily follow the documentation on [redirect lightbox](https://docs.datatrans.ch/docs/redirect-lightbox) and [secure fields](https://docs.datatrans.ch/docs/secure-fields).

## Mode: Redirect / Lightbox Instructions

Follow [secure fields](https://docs.datatrans.ch/docs/secure-fields) and where it says you have to initialize a transaction you have to call one of these mutations:

**Cart Checkout**:

```/*graphql*/
signPaymentProviderForCheckout(
    orderPaymentId: "order payment id of the cart you want to checkout"
)
```

_To get the order payment id of the current active cart of the logged in user you can_

```/*graphql*/
me {
    cart {
        payment {
            _id
        }
    }
}
```

**Payment credentials registration (without payment/checkout)**:

```/*graphql*/
signPaymentProviderForCredentialRegistration(
    paymentProviderId: "payment provider id that you instantiated before"
)
```

For both `signPaymentProviderForCheckout` and `signPaymentProviderForCredentialRegistration` you will receive a JSON stringified object that looks like:

```
{
    location: "https://pay.sandbox.datatrans.com/v1/start/xyz1234..",
    transactionId: "xyz1234.."
}
```

That's when you can either redirect to the location for "Redirect" mode or use the transactionId with the "Lightbox" mode to finalize the Payment as shown here: https://docs.datatrans.ch/docs/redirect-lightbox#section-redirect-integration and https://docs.datatrans.ch/docs/redirect-lightbox#section-lightbox-integration.

When a successful payment is finished, Datatrans will call the Datatrans webhook of Unchained Engine server-side (`DATATRANS_WEBHOOK_PATH`), Unchained Engine will look up the transaction, do some validity checks and then call `checkoutCart` for you, At `checkoutCart` stage, Unchained Engine will settle the payment and also store the payment credential alias for convenience (fast) in further checkouts. Datatrans will also almost immediately redirect to `DATATRANS_SUCCESS_PATH` with the transactionId and in the query parameter.

If for some reason the webhook has not been called at all or failed a checkout server-side at a very early stage, it could happen that when success path is loaded, the cart is not checked out yet but the payment is already authorized and authenticated (not settled). In those cases you should fallback to client-side cart checkout by calling:

```/*graphql*/
checkoutCart(
    orderId: "order id from query parameter",
    paymentContext: { transactionId: "transaction id from query parameter" }) {
    _id,
    status
}
```

This gives Unchained Engine a (second) chance to process and settle the payment. That's how you build rock-solid payment flows in shaky networks.

# Mode: Secure Fields

To let Unchained call the `secureFieldsInit` method during transaction creation, provide `{ "useSecureFields": true }` via the `transactionContext` field to `signPaymentProviderForCheckout` or `signPaymentProviderForCredentialRegistration`. Also you will have to `authorize-split` a secure fields transaction in order to checkout, for that you will have to call `checkoutCart` after form submission with a special object `authorizeAuthenticated`:

```/*graphql*/
checkoutCart(
    orderId: "order id from query parameter",
    paymentContext: { transactionId: "transaction id from query parameter", "authorizeAuthenticated": { "CDM": "...", "3D": "..." } }) {
    _id,
    status
}
```

This will instruct Unchained to authorize an unauthorized transaction before trying to settle it. If you don't have CDM or 3D props to send along, just send an empty object.

# Mode: Mobile SDK

To enable mobile tokens during checkout as stated [here](https://docs.datatrans.ch/docs/mobile-sdk#section-initializing-transactions), send a special `transactionContext` to `signPaymentProviderForCheckout`: `{ "option": { "returnMobileToken": true } }`

# Advanced integration features

**Restrict payment method selection in redirect:**
You can send any additional properties to /v1/transactions/init by setting properties on the context input fields for eg. if you want to restrict payment methods during checkout you could send `{ "paymentMethods": ["VIS"] }` as value for `transactionContext` in `signPaymentProviderForCheckout` to restrict checkout with that provider to VISA credit cards,

**Checkout with alias:**
Just simply do `checkoutCart` without initializing a transactionId. If the user has valid stored payment credentials for the datatrans payment provider, the plugin will try to use that information and directly checkout and settle the payment.

**Asynchronous Webhook:**
As stated [here](https://docs.datatrans.ch/docs/redirect-lightbox#section-webhook) there is the possibility of asynchronous webhooks. Don't enable this, else you will have to "poll" the order status after checkout as webhook-based checkout could still be in-flight and you will miss out on a whole category of errors for the sake of speeding up 1s of processing time.

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.payment.datatrans` |
| Type | `GENERIC` |
| Source | [payment/datatrans-v2/](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/payment/datatrans-v2/) |

## Related

- [Plugins Overview](./) - All available plugins
- [Payment Integration Guide](../../guides/payment-integration.md) - Payment setup guide
- [Checkout Implementation](../../guides/checkout-implementation.md) - Complete checkout flow