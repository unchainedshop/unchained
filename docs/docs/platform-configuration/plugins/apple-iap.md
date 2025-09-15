---
sidebar_position: 11
title: Apple In-App Purchase
sidebar_label: Apple In-App Purchase
---

# Apple In-App Purchase

:::info
Configuration Options for Apple In-App Purchase Integration
:::

Unchained payment plugin for Apple In-App Purchase (IAP), enabling iOS apps to process payments through Apple's payment system with receipt validation.

## Environment Variables

| NAME                      | Default Value | Description                             |
| ------------------------- | ------------- | --------------------------------------- |
| `APPLE_IAP_SHARED_SECRET` |               | Your Apple App Store shared secret     |

## Configuration

### Instantiate a provider

Create an Apple In-App Purchase payment provider:

```graphql
createPaymentProvider(
  paymentProvider: {
    type: GENERIC
    adapterKey: "shop.unchained.apple-iap"
    configuration: []
  }
) {
  _id
}
```

### Apple App Store Setup

1. Configure In-App Purchases in App Store Connect
2. Create products with unique product identifiers
3. Generate a shared secret in App Store Connect
4. Implement StoreKit in your iOS app
5. Set up receipt validation endpoints

## Usage

### Payment Flow

1. **iOS App Purchase**: User initiates purchase through your iOS app using StoreKit

2. **Receipt Validation**: After successful purchase, register the receipt:

```graphql
signPaymentProviderForCredentialRegistration(
  paymentProviderId: "apple-iap-provider-id"
  transactionContext: {
    receiptData: "base64-encoded-receipt-data"
  }
)
```

3. **Create Order**: Create an order with the purchased product and set transaction metadata:

```graphql
updateCartPaymentGeneric(
  paymentProviderId: "apple-iap-provider-id"
  meta: {
    transactionIdentifier: "apple-transaction-id"
  }
)
```

4. **Complete Purchase**: Checkout the order:

```graphql
checkoutCart(
  orderId: "order-id"
  paymentContext: {
    transactionIdentifier: "apple-transaction-id"
    receiptData: "base64-encoded-receipt-data" # optional if already registered
  }
) {
  _id
  status
}
```

### Order Limitations

- **Single Product Orders**: Only one unique product can be purchased per order
- **Quantity Matching**: Order quantity must match the transaction quantity
- **Product ID Matching**: Order product ID must match the transaction product ID

### Receipt Validation

The plugin performs comprehensive receipt validation:
- Verifies receipt authenticity with Apple's servers
- Checks transaction status and validity
- Prevents duplicate transaction processing
- Matches transaction details with order contents

### Transaction Tracking

The plugin maintains a transaction database to:
- Prevent processing the same transaction multiple times
- Track which transactions have been processed
- Store transaction metadata for auditing

## Features

- **Receipt Validation**: Server-side validation with Apple's receipt verification service
- **Duplicate Prevention**: Automatic detection and prevention of duplicate transactions
- **Product Matching**: Ensures purchased products match order contents
- **Transaction Tracking**: Complete audit trail of processed transactions
- **Error Handling**: Comprehensive error messages for debugging

## Security

- **Server-Side Validation**: All receipt validation happens server-side
- **Shared Secret**: Uses Apple's shared secret for secure validation
- **Transaction Deduplication**: Prevents replay attacks and duplicate processing
- **Product Verification**: Ensures purchased products exist and match orders

## Integration Notes

- The plugin does not support payment signing (throws an error if attempted)
- Payment credentials are considered valid once registered with a valid receipt
- Transaction identifiers must be set on order payments before checkout
- Receipt data can be provided during registration or checkout
- Orders are limited to one unique product per transaction

## Apple App Store Requirements

- Configure In-App Purchases in App Store Connect
- Generate and configure a shared secret
- Implement proper StoreKit integration in your iOS app
- Handle receipt validation and transaction completion
- Follow Apple's In-App Purchase guidelines

## Testing

Use Apple's sandbox environment for testing:
- Test with sandbox iTunes accounts
- Use sandbox receipt data for validation
- Verify transaction flows in the sandbox environment
- Test various purchase scenarios and edge cases

## Common Use Cases

- **Digital Products**: Selling digital content, premium features, or subscriptions
- **Mobile Apps**: iOS apps requiring payment processing through Apple's system
- **Content Unlocking**: Unlocking premium content or features after purchase
- **Subscription Services**: Recurring payments through Apple's subscription system