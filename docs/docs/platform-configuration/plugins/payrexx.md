---
sidebar_position: 10
title: Payment through PayRexx
sidebar_label: PayRexx
---

# Payment through PayRexx

:::info
Configuration Options for our PayRexx Integration
:::

Unchained payment plugin for PayRexx, a Swiss payment service provider that supports various payment methods including credit cards, TWINT, PostFinance, and more.

## Environment Variables

| NAME              | Default Value | Description                             |
| ----------------- | ------------- | --------------------------------------- |
| `PAYREXX_SECRET`  |               | Your PayRexx API secret key            |

## Configuration

### Instantiate a provider

When creating a PayRexx payment provider, you need to configure your PayRexx instance:

```graphql
createPaymentProvider(
  paymentProvider: {
    type: GENERIC
    adapterKey: "shop.unchained.payment.payrexx"
    configuration: [
      { key: "instance", value: "your-payrexx-instance-name" }
    ]
  }
) {
  _id
}
```

### PayRexx Account Setup

1. Create a PayRexx account at https://www.payrexx.com/
2. Get your instance name from your PayRexx dashboard
3. Generate an API secret key in your PayRexx settings
4. Configure webhook URLs for payment notifications

## Usage

### Payment Flow

1. **Create Payment Gateway**: Use `signPaymentProviderForCheckout` to create a PayRexx gateway:

```graphql
signPaymentProviderForCheckout(
  orderPaymentId: "order payment id of the cart you want to checkout"
)
```

This returns a JSON string containing the PayRexx gateway object with payment URL.

2. **Redirect to Payment**: Direct the user to the PayRexx payment page using the URL from the gateway object

3. **Handle Webhook**: PayRexx will send webhook notifications when payments are processed

4. **Complete Order**: Use `checkoutCart` with the gateway ID:

```graphql
checkoutCart(
  orderId: "order-id"
  paymentContext: { 
    gatewayId: "payrexx-gateway-id" 
  }
) {
  _id
  status
}
```

### Payment States

The plugin handles various PayRexx payment states:

- **Reserved**: Payment is authorized but not yet captured
- **Confirmed**: Payment is completed and captured
- **Authorized**: Used for tokenization scenarios

### Advanced Features

#### Pre-Authorization and Capture

The plugin supports two-step payments:
- **Confirm**: Capture a previously authorized payment
- **Cancel**: Cancel a reserved payment before capture

#### Error Handling

- Automatic price validation between PayRexx and Unchained orders
- Automatic cancellation of reservations if order validation fails
- Comprehensive logging for debugging payment issues

## Features

- **Multiple Payment Methods**: Support for all PayRexx payment methods
- **Swiss Market Focus**: Optimized for Swiss payment preferences (TWINT, PostFinance, etc.)
- **Pre-Authorization**: Support for authorize-then-capture workflows
- **Webhook Integration**: Automatic payment status updates
- **Order Validation**: Server-side validation of payment amounts
- **Flexible Integration**: Support for both one-time and tokenized payments

## Integration Notes

- The plugin requires a PayRexx instance name in the provider configuration
- Payment amounts are validated server-side for security
- The plugin supports both immediate and deferred payment capture
- Webhook handling ensures reliable payment status updates
- Currency defaults to CHF for credential registration

## Testing

PayRexx provides a test environment:
1. Use your test instance credentials
2. Configure test webhook URLs
3. Use PayRexx test payment methods
4. Monitor payment status in the PayRexx dashboard

## Webhook Configuration

Configure webhooks in your PayRexx dashboard to point to your Unchained server:
- Payment success webhook
- Payment failure webhook  
- Payment cancellation webhook

The webhook URL should follow the pattern: `https://your-domain.com/graphql-webhook`