---
sidebar_position: 6
title: Saferpay
sidebar_label: Saferpay
description: Worldline Saferpay payment integration
---

# Saferpay

Unchained payment plugin for Worldline Saferpay, supporting the Payment Page API for various payment methods.

- [Saferpay JSON API Documentation](https://saferpay.github.io/jsonapi/)
- [Saferpay Integration Guide](https://docs.saferpay.com/home/integration-guide/introduction)

## Installation

**Express:**
```typescript
import saferpayTransactionsModule from '@unchainedshop/plugins/payment/saferpay';
import '@unchainedshop/plugins/payment/saferpay';
import { saferpayHandler } from '@unchainedshop/plugins/payment/saferpay/handler-express';

const { SAFERPAY_WEBHOOK_PATH = '/payment/saferpay/webhook' } = process.env;

// Add module to platform options
const unchainedApi = await startPlatform({
  modules: {
    saferpayTransactions: saferpayTransactionsModule,
  },
});

// Note: Saferpay uses GET method with query parameters, no body parsing needed
app.get(SAFERPAY_WEBHOOK_PATH, saferpayHandler);
```

**Fastify:**
```typescript
import saferpayTransactionsModule from '@unchainedshop/plugins/payment/saferpay';
import '@unchainedshop/plugins/payment/saferpay';
import { saferpayHandler } from '@unchainedshop/plugins/payment/saferpay/handler-fastify';

const { SAFERPAY_WEBHOOK_PATH = '/payment/saferpay/webhook' } = process.env;

// Add module to platform options
const unchainedApi = await startPlatform({
  modules: {
    saferpayTransactions: saferpayTransactionsModule,
  },
});

// Note: Saferpay uses GET method with query parameters
fastify.route({
  url: SAFERPAY_WEBHOOK_PATH,
  method: 'GET',
  handler: saferpayHandler,
});
```

## Create Provider

```graphql
mutation CreateSaferpayProvider {
  createPaymentProvider(
    paymentProvider: {
      type: GENERIC
      adapterKey: "shop.unchained.payment.saferpay"
    }
  ) {
    _id
  }
}

mutation ConfigureSaferpayProvider {
  updatePaymentProvider(
    paymentProviderId: "provider-id"
    paymentProvider: {
      configuration: [
        { key: "terminalId", value: "your-terminal-id" }
      ]
    }
  ) {
    _id
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SAFERPAY_BASE_URL` | `https://test.saferpay.com/api` | API base URL. Production: `https://www.saferpay.com/api` |
| `SAFERPAY_CUSTOMER_ID` | - | Your Saferpay customer ID (required) |
| `SAFERPAY_USER` | - | API username (required) |
| `SAFERPAY_PW` | - | API password (required) |
| `SAFERPAY_WEBHOOK_PATH` | `/payment/saferpay/webhook` | Webhook endpoint path |
| `SAFERPAY_RETURN_PATH` | `/saferpay/return` | User return URL path after payment |
| `ROOT_URL` | `http://localhost:4010` | Base URL for webhook notifications |
| `EMAIL_WEBSITE_URL` | - | Base URL for user redirects (falls back to ROOT_URL) |

## Provider Configuration

| Key | Description |
|-----|-------------|
| `terminalId` | Your Saferpay terminal ID (required) |

## Payment Flow

### 1. Sign for Checkout

Initialize a Saferpay Payment Page:

```graphql
mutation SignPayment {
  signPaymentProviderForCheckout(
    orderPaymentId: "order-payment-id"
    transactionContext: {
      description: "Order Payment"
    }
  )
}
```

Returns a JSON string:
```json
{
  "location": "https://test.saferpay.com/vt2/api/PaymentPage/...",
  "token": "saferpay-token",
  "transactionId": "hex-transaction-id"
}
```

### 2. Redirect to Payment Page

```typescript
const result = JSON.parse(signResult);
window.location.href = result.location;
```

### 3. Handle Return

After payment, users are redirected to:
```
EMAIL_WEBSITE_URL + SAFERPAY_RETURN_PATH?transactionId=<hex-id>
```

### 4. Complete Checkout

```graphql
mutation CheckoutWithSaferpay {
  checkoutCart(
    paymentContext: {
      transactionId: "hex-transaction-id"
    }
  ) {
    _id
    status
    orderNumber
  }
}
```

## Webhook Notifications

The webhook receives success notifications automatically:
```
ROOT_URL/payment/saferpay/webhook?orderPaymentId=<id>&signature=<sig>&transactionId=<hex-id>
```

The signature is verified server-side for security.

## Payment States

| Saferpay Status | Description | Action |
|-----------------|-------------|--------|
| `AUTHORIZED` | Payment authorized | Ready for capture |
| `CAPTURED` | Payment captured | Order complete |

## Confirm and Cancel

### Capture Payment

After successful checkout with `AUTHORIZED` status:

```graphql
mutation ConfirmOrder {
  confirmOrder(orderId: "order-id") {
    _id
    status
  }
}
```

### Cancel Authorization

Before capture:

```graphql
mutation CancelOrder {
  rejectOrder(orderId: "order-id") {
    _id
    status
  }
}
```

## Multiple Terminals

Create multiple providers with different terminal IDs:

```graphql
mutation CreateCHFTerminal {
  createPaymentProvider(
    paymentProvider: {
      type: GENERIC
      adapterKey: "shop.unchained.payment.saferpay"
    }
  ) {
    _id
  }
}

mutation ConfigureCHFTerminal {
  updatePaymentProvider(
    paymentProviderId: "provider-id"
    paymentProvider: {
      configuration: [
        { key: "terminalId", value: "chf-terminal-id" }
      ]
    }
  ) {
    _id
  }
}
```

## Transaction Context Options

Available options in `transactionContext`:

| Key | Description |
|-----|-------------|
| `description` | Payment description shown to user |
| `Payment` | Override payment details |
| `ReturnUrl` | Override return URL |

## Testing

Use test credentials:
- Set `SAFERPAY_BASE_URL=https://test.saferpay.com/api`
- Use Saferpay test credentials
- Test cards available in Saferpay documentation

## Features

- Payment Page API integration
- Multiple terminal support
- Authorization with deferred capture
- Signature-verified webhooks
- Cancellation support

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.payment.saferpay` |
| Type | `GENERIC` |
| Version | `1.38.0` |
| Source | [payment/saferpay/](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/payment/saferpay/) |

## Related

- [Plugins Overview](./) - All available plugins
- [Payment Integration Guide](../../guides/payment-integration.md) - Payment setup guide
- [Checkout Implementation](../../guides/checkout-implementation.md) - Complete checkout flow
