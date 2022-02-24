---
title: 'Plugin: Payment through PostFinance Checkout'
description: Configuration Options for our PostFinance Checkout Integration
---

The Unchained plugin implements the PostFinance Checkout payment service with support for all payment methods, different integration modes (payment page, lightbox, and iFrame), deferred settlements, and refunds. 
Documentation of the PostFinance Checkout service is located [here](https://checkout.postfinance.ch/de-ch/doc/api/web-service).

# Configuration

## Postfinance Checkout
You have to configure the [webhooks](https://checkout.postfinance.ch/space/select?target=/webhook/listener/list) for accepted payments ("Verbuchung der Transaktion" -> "Erfolgreich") and failed payments ("Verbuchung der Transaktion" -> "Fehlgeschlagen").

## Environment Variables

| NAME                      | Default Value                          | Description                             |
| ------------------------- | -------------------------------------- | --------------------------------------- |
| `PFCHECKOUT_SPACE_ID`     |                                        |                                         |
| `PFCHECKOUT_USER_ID`      |                                        |                                         |
| `PFCHECKOUT_SECRET`       |                                        |
| `PFCHECKOUT_WEBHOOK_PATH` | `/graphql/postfinance-checkout`        | Path needs to correspond to the path that you configured in the PostFinance Checkout webinterface |
| `PFCHECKOUT_SUCCESS_URL`  |                                        | URL that the user is forwarded to after a successful payment. `?order_id=<unchained id of the order>` is automatically added |
| `PFCHECKOUT_FAILED_URL`   |                                        | URL that the user is forwarded to after a failed payment. `?order_id=<unchained id of the order>` is automatically added |

For test environments, the space ID needs to be set to the corresponding space ID.

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
With `completionMode`, you can configure if the transaction should be completed immediately (default behavior if nothing is specified explicitly, value `Immediate`) or if only a reservation should be created (`Deferred`) that can be voided / completed later. To create a deferred transaction, you would therefore use:
```/*graphql*/
signPaymentProviderForCheckout(
    orderPaymentId: "order payment id of the cart you want to checkout",
    transactionContext: {completionMode: "Deferred"}
)
```
*Note that not all payment methods support deferred settlements. Alternatively, you can also use refunds.*

When you use deferred completion, the order is not marked as paid after the user has authorized the transaction.
To settle it, the mutation `confirmOrderPayment` is used:
```/*graphql*/
mutation confirmPayment {
  confirmOrderPayment(orderPaymentId: "order payment id of the cart you want to checkout")
}
```
It tries to complete the transaction and marks the order as paid if this was successful. For the cancelation of a transaction, `cancelOrderPayment` (see below) can be used.

## Cancellation / Refunds

An order payment can be cancelled in two cases:
1. A transaction was started with deferred settlement (i.e., only a reservation was created) and it should not be completed.
2. A transaction completed successfully, but there should be a refund to the user for some reason.

In both cases, the mutation `cancelOrderPayment` can be used. Without any parameters or when setting `refund` inside the `transactionContext` to `false`, the mutation only tries to void reservations that were created because of a transaction with deferred settlement.
If you pass `refund: true` inside the `transactionContext`, a refund is requested when voiding a reservation is not possible (e.g., because the transaction was already completed or direct settlement was used). If this succeeds, the status of the order is changed to `OPEN` again and the order payment has status `REFUNDED`.

```/*graphql*/
mutation cancelPayment {
  cancelOrderPayment(orderPaymentId: "order payment id of the cart you want to checkout", transactionContext: {refund: true})
}
```

## Saved Payment Methods

The tokenization mode is set to `ALLOW_ONE_CLICK_PAYMENT` and the Unchained customer ID is passed to the PostFinance API.
This gives the user the option to save a payment method. When he does this and orders for a second time, the saved method can be directly selected.

# Testing

For testing purposes, you can create a dedicated space in the PostFinance Checkout web interface and set it to testing mode.
In this mode, transactions can be paid with test payment methods that appear in the web interface.
`PFCHECKOUT_SPACE_ID` needs to be set to the id of this space (for unit tests or when running end user tests on a dev / staging environment).