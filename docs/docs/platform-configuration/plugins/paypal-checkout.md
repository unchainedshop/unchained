---
sidebar_position: 9
title: Payment through PayPal Checkout
sidebar_label: PayPal Checkout
---

# Payment through PayPal Checkout

:::info
Configuration Options for our PayPal Checkout Integration
:::

Unchained payment plugin for PayPal Checkout using the PayPal Checkout Server SDK. This plugin enables secure PayPal payments with order verification.

## Environment Variables

| NAME                 | Default Value | Description                             |
| -------------------- | ------------- | --------------------------------------- |
| `PAYPAL_CLIENT_ID`   |               | Your PayPal application client ID      |
| `PAYPAL_SECRET`      |               | Your PayPal application secret         |
| `PAYPAL_ENVIRONMENT` | `sandbox`     | PayPal environment (`sandbox` or `live`) |

## Configuration

### Instantiate a provider

Create a PayPal Checkout payment provider:

```graphql
createPaymentProvider(
  paymentProvider: {
    type: GENERIC
    adapterKey: "shop.unchained.payment.paypal"
    configuration: []
  }
) {
  _id
}
```

### Environment Setup

**Sandbox Mode (Testing):**
- Set `PAYPAL_ENVIRONMENT=sandbox` or leave it as default
- Use sandbox client ID and secret from your PayPal Developer Dashboard

**Production Mode:**
- Set `PAYPAL_ENVIRONMENT=live`
- Use live client ID and secret from your PayPal application

## Usage

### Payment Flow

1. **Get Client ID**: Use `signPaymentProviderForCheckout` to get the PayPal client ID:

```graphql
signPaymentProviderForCheckout(
  orderPaymentId: "order payment id of the cart you want to checkout"
)
```

2. **Initialize PayPal SDK**: Use the returned client ID to initialize the PayPal JavaScript SDK on your frontend

3. **Create PayPal Order**: Use PayPal's frontend SDK to create an order and get an `orderID`

4. **Complete Payment**: After PayPal order approval, checkout with:

```graphql
checkoutCart(
  orderId: "order-id"
  paymentContext: { 
    orderID: "paypal-order-id-from-frontend" 
  }
) {
  _id
  status
}
```

### Order Verification

The plugin performs automatic order verification by:
- Retrieving the PayPal order details using the provided `orderID`
- Comparing the PayPal order total with the Unchained order total
- Only approving payments when amounts match exactly

### Error Handling

If the order totals don't match:
- The payment will be rejected
- Detailed logging will show the PayPal order details
- An error will be thrown with payment mismatch information

## Features

- **Automatic Order Verification**: Ensures payment amounts match between PayPal and Unchained
- **Environment Support**: Easy switching between sandbox and production
- **Comprehensive Logging**: Detailed logs for debugging payment issues
- **Security**: Server-side order verification prevents payment manipulation

## Integration Notes

- The plugin requires the `@paypal/checkout-server-sdk` as a peer dependency
- Order verification happens server-side for security
- The plugin expects an `orderID` from PayPal's frontend SDK during checkout
- Currency and amounts are automatically handled based on the Unchained order

## PayPal Developer Setup

1. Create a PayPal Developer account at https://developer.paypal.com/
2. Create a new application to get your client ID and secret
3. Configure your webhook URLs (if needed)
4. Use sandbox credentials for testing, live credentials for production

## Testing

Use PayPal's sandbox environment with test accounts:
- Set `PAYPAL_ENVIRONMENT=sandbox`
- Use sandbox client credentials
- Test with PayPal sandbox buyer accounts

:::warning
The PayPal Checkout Server SDK used by this plugin is deprecated. PayPal recommends migrating to `@paypal/paypal-server-sdk`. Consider updating the plugin implementation for new projects.
:::