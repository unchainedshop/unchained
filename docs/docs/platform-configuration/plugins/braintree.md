---
sidebar_position: 8
title: Payment through Braintree
sidebar_label: Braintree
---

# Payment through Braintree

:::info
Configuration Options for our Braintree Integration
:::

Unchained payment plugin for Braintree, a PayPal-owned payment processor that supports various payment methods including PayPal, credit cards, and digital wallets.

## Environment Variables

| NAME                      | Default Value | Description                             |
| ------------------------- | ------------- | --------------------------------------- |
| `BRAINTREE_SANDBOX_TOKEN` |               | Access token for sandbox environment (testing) |
| `BRAINTREE_PRIVATE_KEY`   |               | Private key for production environment |

## Configuration

### Instantiate a provider

When creating a Braintree payment provider, you need to configure the public key and merchant ID:

```graphql
createPaymentProvider(
  paymentProvider: {
    type: GENERIC
    adapterKey: "shop.unchained.braintree-direct"
    configuration: [
      { key: "publicKey", value: "your-public-key" }
      { key: "merchantId", value: "your-merchant-id" }
    ]
  }
) {
  _id
}
```

### Environment Setup

**Sandbox Mode (Testing):**
- Set `BRAINTREE_SANDBOX_TOKEN` environment variable
- The plugin will automatically use sandbox mode when this token is present

**Production Mode:**
- Remove `BRAINTREE_SANDBOX_TOKEN` or leave it empty
- Configure `publicKey`, `merchantId` in the provider configuration
- Set `BRAINTREE_PRIVATE_KEY` environment variable

## Usage

### Payment Flow

1. **Get Client Token**: Use `signPaymentProviderForCheckout` to get a client token:

```graphql
signPaymentProviderForCheckout(
  orderPaymentId: "order payment id of the cart you want to checkout"
)
```

2. **Initialize Braintree Client**: Use the returned client token to initialize the Braintree client-side SDK

3. **Process Payment**: After collecting payment method nonce from Braintree SDK, checkout with:

```graphql
checkoutCart(
  orderId: "order-id"
  paymentContext: { 
    paypalPaymentMethodNonce: "nonce-from-braintree-sdk" 
  }
) {
  _id
  status
}
```

### Payment Method Support

The plugin currently supports:
- PayPal payments via Braintree
- Credit card processing through Braintree SDK
- Various payment methods supported by Braintree

### Currency and Merchant Accounts

- The plugin uses the order's currency code as the merchant account ID
- Amounts are automatically rounded to the nearest 10 cents
- Billing address information is automatically passed to Braintree for fraud prevention

## Features

- **Automatic Settlement**: Payments are submitted for settlement immediately
- **Address Integration**: Billing addresses are automatically sent to Braintree
- **Error Handling**: Comprehensive error handling and logging
- **Development Support**: Easy sandbox mode for testing

## Integration Notes

- The plugin expects a `paypalPaymentMethodNonce` in the payment context during checkout
- Order numbers are passed to Braintree for tracking (falls back to order ID if no order number)
- The plugin requires the Braintree Node.js SDK as a peer dependency

## Testing

Use the `BRAINTREE_SANDBOX_TOKEN` for testing. You can obtain this token from your Braintree sandbox account dashboard.