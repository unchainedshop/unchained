---
title: 'Plugin: Payment through PostFinance Checkout'
description: Configuration Options for our PostFinance Checkout Integration
---
# Configuration

## Postfinance Checkout
You have to configure the [webhooks](https://checkout.postfinance.ch/space/select?target=/webhook/listener/list) for accepted payments ("Verbuchung der Transaktion" -> "Erfolgreich") and failed payments ("Verbuchung der Transaktion" -> "Fehlgeschlagen").

# Usage

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

## Saved Payment Methods

The tokenization mode is set to `ALLOW_ONE_CLICK_PAYMENT` and the Unchained customer ID is passed to the PostFinance API.
This gives the user the option to save a payment method. When he does this and orders for a second time, the saved method can be directly selected.