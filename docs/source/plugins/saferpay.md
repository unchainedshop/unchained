---
title: 'Payment through Wordline Saferpay'
description: Configuration Options for our Worldline Saferpay Integration
---

Unchained payment plugin for Worldline Saferpay. The JSON API that is consumed by the plugin is documented [here](https://saferpay.github.io/jsonapi/), a general integration documentation can be accessed [here](https://docs.saferpay.com/home/integration-guide/introduction).

# Configuration

## Worldline Saferpay

You can create multiple terminals in the backoffice. The terminal ID is passed in the configuration options, which allows you to instantiate multiple Saferpay plugins with the same credentials, but different terminal IDs.

## Environment Variables


| NAME                      | Default Value                          | Description                             |
| ------------------------- | -------------------------------------- | --------------------------------------- |
| `SAFERPAY_BASE_URL`      | `https://test.saferpay.com/api`        | `https://test.saferpay.com/api` for the test system, `https://www.saferpay.com/api` for the production system |
| `SAFERPAY_CUSTOMER_ID`   |                                        |                                         |
| `SAFERPAY_USER`            |                                        |
| `SAFERPAY_PW`            |                                        |
| `SAFERPAY_WEBHOOK_PATH`            |                                        |
| `SAFERPAY_RETURN_PATH`    |                                        | URL that the user is forwarded to after a successful/failed payment. `?order_id=<unchained id of the order>` is automatically added |


## Instantiate a provider

When instantiating the provider, you have to provide the terminal ID:
```/*graphql*/
updatePaymentProvider(paymentProviderId: "id of the provider", 
                      paymentProvider: {configuration: {key: "terminalId", value: "<id>"}}) {
    _id
}
```

# Usage

To start a new Worldline Saferpay transaction, the mutation `signPaymentProviderForCheckout` is used. You can optionally specify the field `description` (text that is shown to the user on the payment page) in the `transactionContext`.

The mutation returns a stringified JSON object with the transaction ID and the location:
```json
{
    "transactionId": "<id>",
    "location": "https://test.saferpay.com/vt2/api/PaymentPage/1/2/abc?transactionId=UNCHAINED_TRX_ID"
}
```
The user will be redirected to the success (or failure) URL after entering the payment credentials. To complete the order, you have to call `checkoutCart` and provide the previously retrieved `transactionId`

```/*graphql*/
checkoutCart(
    orderId: "order id from query parameter",
    paymentContext: {transactionId: "retrieved transaction id"}) { 
    _id, 
    status
}
```

## Cancellation / Refunds

Cancellations via `rejectOrder` are supported by the plugin.