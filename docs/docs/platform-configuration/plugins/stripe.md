---
sidebar_position: 12
title: Payment through Stripe
sidebar_label: Stripe
---

# Payment through Stripe

:::info
Configuration Options for our Stripe Integration
:::

Unchained payment plugin for Stripe, supporting payment intents, saved payment methods, and comprehensive payment processing.

## Environment Variables

| NAME                    | Default Value | Description                             |
| ----------------------- | ------------- | --------------------------------------- |
| `STRIPE_SECRET_KEY`     |               | Your Stripe secret key                 |
| `STRIPE_WEBHOOK_SECRET` |               | Stripe webhook endpoint secret (optional) |

## Configuration

### Instantiate a provider

Create a Stripe payment provider with optional descriptor prefix:

```graphql
createPaymentProvider(
  paymentProvider: {
    type: GENERIC
    adapterKey: "shop.unchained.payment.stripe"
    configuration: [
      { key: "descriptorPrefix", value: "Your Store Name" }
    ]
  }
) {
  _id
}
```

### Stripe Account Setup

1. Create a Stripe account at https://stripe.com/
2. Get your API keys from the Stripe Dashboard
3. Configure webhook endpoints for payment processing
4. Set up your payment methods and currencies

## Usage

### Payment Flow

1. **Create Payment Intent**: Use `signPaymentProviderForCheckout` to create a payment intent:

```graphql
signPaymentProviderForCheckout(
  orderPaymentId: "order payment id of the cart you want to checkout"
)
```

This returns a client secret for the payment intent.

2. **Process Payment**: Use Stripe's frontend SDK with the client secret to collect payment

3. **Complete Order**: After successful payment, checkout with payment intent ID:

```graphql
checkoutCart(
  orderId: "order-id"
  paymentContext: { 
    paymentIntentId: "pi_stripe_payment_intent_id" 
  }
) {
  _id
  status
}
```

### Saved Payment Methods

#### Register Payment Method

For saved payment methods, create a setup intent:

```graphql
signPaymentProviderForCredentialRegistration(
  paymentProviderId: "stripe-provider-id"
)
```

Then register the payment method after setup:

```graphql
registerPaymentCredentials(
  paymentProviderId: "stripe-provider-id"
  transactionContext: {
    setupIntentId: "seti_stripe_setup_intent_id"
  }
)
```

#### Use Saved Payment Method

Checkout with saved payment credentials:

```graphql
checkoutCart(
  orderId: "order-id"
  paymentContext: { 
    paymentCredentials: {
      token: "pm_stripe_payment_method_id"
      meta: {
        customer: "cus_stripe_customer_id"
        payment_method_types: ["card"]
      }
    }
  }
) {
  _id
  status
}
```

### Payment Validation

The plugin performs several validation checks:
- **Amount Verification**: Ensures payment intent amount matches order total
- **Currency Verification**: Confirms currency matches order currency
- **Order Matching**: Verifies payment intent belongs to the correct order
- **Status Checking**: Only processes succeeded payment intents

## Features

- **Payment Intents**: Modern Stripe payment processing with SCA compliance
- **Saved Payment Methods**: Support for tokenized payment methods
- **Customer Management**: Automatic Stripe customer creation and management
- **Webhook Support**: Process payments via Stripe webhooks
- **Descriptor Prefix**: Customizable statement descriptors
- **Multi-Currency**: Support for various currencies
- **3D Secure**: Built-in Strong Customer Authentication (SCA)

## Webhook Configuration

Configure webhooks in your Stripe Dashboard:

1. **Webhook URL**: Point to your payment handler endpoint
2. **Events**: Listen for `payment_intent.succeeded` and related events
3. **Webhook Secret**: Set `STRIPE_WEBHOOK_SECRET` for signature verification

## Testing

### Stripe CLI for Local Development

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login with your secret key
stripe login --api-key sk_test_...

# Forward webhooks to local server
stripe listen --forward-to http://localhost:4010/payment/stripe

# Test webhook events
stripe trigger payment_intent.succeeded
```

### Test Cards

Use Stripe's test card numbers:
- `4242424242424242` - Visa (succeeds)
- `4000000000000002` - Visa (declined)
- `4000002500003155` - Visa (requires authentication)

## Integration Notes

- The plugin automatically creates Stripe customers for user management
- Payment method validation returns true once a valid payment method is registered
- The plugin supports both immediate and deferred payment processing
- Customer email and name are automatically passed to Stripe
- Payment intents are created with automatic payment method confirmation

## Configuration Options

### Descriptor Prefix

Set a custom descriptor prefix that appears on customer statements:

```graphql
configuration: [
  { key: "descriptorPrefix", value: "MYSTORE" }
]
```

This helps customers identify charges on their statements.

### Advanced Features

- **Setup Intents**: For saving payment methods without immediate charge
- **Customer Portal**: Integration with Stripe's customer portal
- **Subscription Support**: Compatible with Stripe's subscription features
- **Multi-Party Payments**: Support for complex payment scenarios

## Security

- **Server-Side Validation**: All payment verification happens server-side
- **Webhook Signatures**: Verify webhook authenticity with signature validation
- **PCI Compliance**: Stripe handles PCI compliance requirements
- **Tokenization**: Secure storage of payment methods via Stripe tokens