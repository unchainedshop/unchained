---
sidebar_position: 9
title: PayPal Checkout (Deprecated)
sidebar_label: PayPal (Deprecated)
description: PayPal Checkout integration for secure payments (deprecated)
---

# PayPal Checkout

:::danger Deprecated Plugin
This plugin is deprecated because it relies on the `@paypal/checkout-server-sdk` npm package, which PayPal has deprecated. For new projects, consider using Stripe or Braintree (which supports PayPal payments). If you need native PayPal integration, the plugin will need to be updated to use `@paypal/paypal-server-sdk`.
:::

Unchained payment plugin for PayPal Checkout using the PayPal Checkout Server SDK. This plugin enables secure PayPal payments with order verification.

- [PayPal Developer Documentation](https://developer.paypal.com/docs/api/overview/)
- [PayPal Checkout Integration](https://developer.paypal.com/docs/checkout/)
- [PayPal JavaScript SDK](https://developer.paypal.com/docs/checkout/integrate/)

## Installation

```typescript
import '@unchainedshop/plugins/payment/paypal-checkout';
```

Requires the `@paypal/checkout-server-sdk` npm package as a peer dependency:

```bash
npm install @paypal/checkout-server-sdk
```

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
mutation CreatePayPalProvider {
  createPaymentProvider(
    paymentProvider: {
      type: GENERIC
      adapterKey: "shop.unchained.payment.paypal"
    }
  ) {
    _id
  }
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
mutation GetPayPalClientID {
  signPaymentProviderForCheckout(
    orderPaymentId: "order payment id of the cart you want to checkout"
  )
}
```

2. **Initialize PayPal SDK**: Use the returned client ID to initialize the PayPal JavaScript SDK on your frontend

3. **Create PayPal Order**: Use PayPal's frontend SDK to create an order and get an `orderID`

4. **Complete Payment**: After PayPal order approval, checkout with:

```graphql
mutation CheckoutCart {
  checkoutCart(
    orderId: "order-id"
    paymentContext: {
      orderID: "paypal-order-id-from-frontend"
    }
  ) {
    _id
    status
  }
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

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.payment.paypal` |
| Type | `GENERIC` |
| Source | [payment/paypal-checkout.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/payment/paypal-checkout.ts) |

## Related

- [Plugins Overview](./) - All available plugins
- [Braintree](./braintree.md) - Alternative with PayPal support
- [Payment Integration Guide](../../guides/payment-integration.md) - Payment setup guide