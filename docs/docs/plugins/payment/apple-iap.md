---
sidebar_position: 11
title: Apple In-App Purchase
description: Integrate Apple In-App Purchase as a payment provider for iOS app purchases in Unchained Engine.
sidebar_label: Apple In-App Purchase
---

# Apple In-App Purchase

Payment plugin for [Apple In-App Purchase](https://developer.apple.com/in-app-purchase/): iOS apps purchase via [StoreKit](https://developer.apple.com/documentation/storekit), the plugin validates receipts server-side against Apple's [receipt verification service](https://developer.apple.com/documentation/appstorereceipts/verifying_receipts_with_the_app_store) and tracks processed transactions to prevent duplicates.

## Installation

Included in the [`all` preset](../../platform-configuration/plugin-presets.md) — `registerAllPlugins()` registers the plugin together with its webhook route and database module.

To register it individually:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { AppleIAPPlugin } from '@unchainedshop/plugins/payment/apple-iap';

pluginRegistry.register(AppleIAPPlugin);
```

Register before `startPlatform()`. Registration mounts the route `POST /payment/apple-iap` for [App Store server notifications](https://developer.apple.com/documentation/appstoreservernotifications) (path configurable via `APPLE_IAP_WEBHOOK_PATH`) and adds the `appleTransactions` database module. Registration throws if `APPLE_IAP_SHARED_SECRET` is not set.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APPLE_IAP_SHARED_SECRET` | - | App Store shared secret for receipt validation (required, registration throws without it) |
| `APPLE_IAP_ENVIRONMENT` | `sandbox` | Receipt verification environment: `sandbox` or `production` |
| `APPLE_IAP_WEBHOOK_PATH` | `/payment/apple-iap` | Server notification endpoint path |

## Create Provider

```graphql
mutation CreateAppleIAPProvider {
  createPaymentProvider(
    paymentProvider: {
      type: GENERIC
      adapterKey: "shop.unchained.apple-iap"
    }
  ) {
    _id
  }
}
```

## Payment Flow

The plugin does not support payment signing (`signPaymentProviderForCheckout` throws) — the purchase happens in the iOS app via StoreKit:

1. **iOS app purchase**: the user buys through StoreKit.

2. **Register the receipt**:

```graphql
mutation RegisterReceipt {
  registerPaymentCredentials(
    paymentProviderId: "apple-iap-provider-id"
    transactionContext: {
      receiptData: "base64-encoded-receipt-data"
    }
  ) {
    _id
  }
}
```

3. **Set the transaction identifier on the cart payment**:

```graphql
mutation UpdatePayment {
  updateCartPaymentGeneric(
    paymentProviderId: "apple-iap-provider-id"
    meta: {
      transactionIdentifier: "apple-transaction-id"
    }
  ) {
    _id
  }
}
```

4. **Checkout**:

```graphql
mutation CheckoutCart {
  checkoutCart(
    paymentContext: {
      receiptData: "base64-encoded-receipt-data" # optional if already registered
    }
  ) {
    _id
    status
  }
}
```

The charge validates the receipt with Apple, matches the transaction against the order, and rejects already-processed transactions.

## Order Constraints

- Only **one unique product** per order.
- Order quantity must match the transaction quantity.
- The order's product ID must match the transaction's `product_id`.

## Testing

Use Apple's sandbox: keep `APPLE_IAP_ENVIRONMENT=sandbox` and test with sandbox App Store accounts and receipts.

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.apple-iap` |
| Type | `GENERIC` |
| Version | `1.0.0` |
| Source | [payment/apple-iap/](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/payment/apple-iap) |
