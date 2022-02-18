---
title: 'Plugin: Payment through PostFinance Checkout'
description: Configuration Options for our PostFinance Checkout Integration
---

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