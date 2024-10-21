---
sidebar_position: 2
title: Payment through Datatrans
---
# Payment through datatrans
:::
Configuration Options for our Datatrans Integration
:::


Unchained supports both the old XML based legacy API of Datatrans [payment process overview](https://docs.datatrans.ch/v1.0.1/docs/payment-process-overview) and the new [transactionId centric API based on JSON](https://docs.datatrans.ch/docs/home)
If you already have Datatrans chances are high you're still using the legacy API and so you will have to use the legacy Datatrans Unchained Plugin. If you're starting fresh, you will be using the new one.

Activate either of those in your project by selecting to import one (and only one):

- Old Legacy API (v1): `import '@unchainedshop/core-payment/plugins/datatrans';`
- Current API (v2): `import '@unchainedshop/core-payment/plugins/datatrans-v2';`

The rest of this page will center around the new v2 plugin. If you need support for the legacy plugin, check the source of the plugin and if questions arise, send us an e-mail.

# Setup Plugin v2

## Environment variables

You have to set `DATATRANS_SECRET` and `DATATRANS_SIGN_KEY` on build-time based on the configuration on your Datatrans Merchant Account:

| NAME                     | Default Value                          | Allowed Values                          |
| ------------------------ | -------------------------------------- | --------------------------------------- |
| `DATATRANS_SECRET`       |                                        |                                         |
| `DATATRANS_SIGN_KEY`     |                                        |                                         |
| `DATATRANS_SIGN2_KEY`    | `{DATATRANS_SIGN_KEY}`                 |                                         |
| `DATATRANS_SECURITY`     | `dynamic-sign`                         | `''`, `'static-sign'`, `'dynamic-sign'` |
| `DATATRANS_API_ENDPOINT` | `https://api.sandbox.datatrans.com`    |                                         |
| `DATATRANS_WEBHOOK_PATH` | `{ROOT_URL}/payment/datatrans/webhook` |                                         |
| `DATATRANS_SUCCESS_PATH` | `{ROOT_URL}/payment/datatrans/success` |                                         |
| `DATATRANS_ERROR_PATH`   | `{ROOT_URL}/payment/datatrans/error`   |                                         |
| `DATATRANS_CANCEL_PATH`  | `{ROOT_URL}/payment/datatrans/cancel`  |                                         |
| `DATATRANS_RETURN_PATH`  | `{ROOT_URL}/payment/datatrans/return`  |                                         |

In order to activate live payments, you will have to set the `DATATRANS_API_ENDPOINT` to the non-sandbox URL.

### Configure Datatrans

## Instantiate a provider

When adding a datatrans payment provider either through the Admin UI or with the `createPaymentProvider`, you will need to tell it with which merchantId it authenticates requests against the Datatrans API, the configuration parameters you can set are:

| KEY                 | Default Value | Allowed Values                                                 |
| ------------------- | ------------- | -------------------------------------------------------------- |
| `merchantId`        |               |                                                                |
| `settleInUnchained` | 1             | "1", ""                                                        |
| `marketplaceSplit`  |               | "SUBMERCHANTID;DISCOUNT_ADAPTER_KEY;OPTIONAL_SHARE_PERCENTAGE" |

If you don't set the merchantId on the provider, Unchained tries to read it from the environment variable DATATRANS_MERCHANT_ID

Unchained Engine supports Datatrans Marketplace Integration:

You can add multiple `marketplaceSplit` entries to configure marketplace payments. See https://docs.datatrans.ch/docs/marketplace-payments#section-settlement-splits for more information. `settleInUnchained` has to be 1 if you want to use marketplace features because split happens at settlement.

The marketplace feature depends on a custom discount that pre-calculates the comissions before checkout. That adapter key then needs to be referenced in the payment configuration.

You can also configure more than one sub merchant and then split the "pie" based on OPTIONAL_SHARE_PERCENTAGE, keep in mind that if you have more than one, the sum of all OPTIONAL_SHARE_PERCENTAGE needs to be 100.

Of course, you can add any additional properties to the configuration if you need that to filter payment providers.

If you want to use a deferred settlement of Unchained Engine for only some specific payment providers, you will have to instantiate multiple providers and select the correct one from the frontend, so in these cases, it helps to add additional properties server-side that may help the UI distinguish the providers.

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