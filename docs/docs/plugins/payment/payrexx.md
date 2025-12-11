---
sidebar_position: 10
title: Payrexx
sidebar_label: Payrexx
description: Swiss payment provider supporting TWINT, PostFinance, and more
---

# Payrexx

Unchained payment plugin for Payrexx, a Swiss payment service provider supporting various payment methods including credit cards, TWINT, PostFinance, and more.

- [Payrexx API Documentation](https://docs.payrexx.com)

## Installation

**Express:**
```typescript
import express from 'express';
import '@unchainedshop/plugins/payment/payrexx';
import { payrexxHandler } from '@unchainedshop/plugins/payment/payrexx/handler-express';

const { PAYREXX_WEBHOOK_PATH = '/payment/payrexx' } = process.env;

app.use(PAYREXX_WEBHOOK_PATH, express.json({ type: 'application/json' }), payrexxHandler);
```

**Fastify:**
```typescript
import '@unchainedshop/plugins/payment/payrexx';
import { payrexxHandler } from '@unchainedshop/plugins/payment/payrexx/handler-fastify';

const { PAYREXX_WEBHOOK_PATH = '/payment/payrexx' } = process.env;

fastify.route({
  url: PAYREXX_WEBHOOK_PATH,
  method: 'POST',
  handler: payrexxHandler,
});
```

## Create Provider

```graphql
mutation CreatePayrexxProvider {
  createPaymentProvider(
    paymentProvider: {
      type: GENERIC
      adapterKey: "shop.unchained.payment.payrexx"
      configuration: [
        { key: "instance", value: "your-instance-name" }
      ]
    }
  ) {
    _id
  }
}
```

## Configure Payrexx Dashboard

1. Log in to your Payrexx dashboard
2. Go to **Settings** > **Webhooks**
3. Add webhook URL: `https://your-domain.com/payment/payrexx`
4. Enable transaction notifications

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PAYREXX_SECRET` | - | Your Payrexx API secret key (required) |
| `PAYREXX_WEBHOOK_PATH` | `/payment/payrexx` | Webhook endpoint path |
| `EMAIL_WEBSITE_URL` | - | Base URL for redirects (e.g., `https://shop.example.com`) |
| `EMAIL_WEBSITE_NAME` | `Unchained` | Shop name shown in payment purpose |
| `DATATRANS_SUCCESS_PATH` | `/payrexx/success` | Path for successful payment redirect |
| `DATATRANS_ERROR_PATH` | `/payrexx/error` | Path for failed payment redirect |
| `DATATRANS_CANCEL_PATH` | `/payrexx/cancel` | Path for cancelled payment redirect |

## Provider Configuration

| Key | Description |
|-----|-------------|
| `instance` | Your Payrexx instance name (required) |

## Payment Flow

### 1. Sign for Checkout

Create a Payrexx gateway for the order:

```graphql
mutation SignPayment {
  signPaymentProviderForCheckout(orderPaymentId: "order-payment-id")
}
```

Returns a JSON string containing:
```json
{
  "id": "gateway-id",
  "status": "waiting",
  "link": "https://instance.payrexx.com/pay?gateway=..."
}
```

### 2. Redirect to Payment

Parse the response and redirect the user to the `link` URL:

```typescript
const gateway = JSON.parse(signResult);
window.location.href = gateway.link;
```

### 3. Handle Redirect

The user is redirected back to your configured paths:
- **Success**: `EMAIL_WEBSITE_URL + DATATRANS_SUCCESS_PATH`
- **Error**: `EMAIL_WEBSITE_URL + DATATRANS_ERROR_PATH`
- **Cancel**: `EMAIL_WEBSITE_URL + DATATRANS_CANCEL_PATH`

### 4. Complete via Webhook

The webhook automatically completes the checkout when payment is confirmed:

```typescript
// Webhook handler calls internally:
await services.orders.checkoutOrder(orderId, {
  paymentContext: { gatewayId: 'payrexx-gateway-id' }
});
```

### 5. Manual Checkout (Alternative)

If not using webhooks, complete manually:

```graphql
mutation CheckoutWithPayrexx {
  checkoutCart(
    paymentContext: {
      gatewayId: "payrexx-gateway-id"
    }
  ) {
    _id
    status
    orderNumber
  }
}
```

## Payment States

| Payrexx Status | Description | Unchained Action |
|----------------|-------------|------------------|
| `waiting` | Awaiting payment | No action |
| `reserved` | Payment authorized | Ready for checkout |
| `confirmed` | Payment captured | Order confirmed |

## Pre-Authorization Flow

Payrexx uses reservation mode by default:

1. **Reserve**: Payment is authorized at checkout
2. **Confirm**: Call `confirmOrder` to capture the payment
3. **Cancel**: Call `rejectOrder` to release the reservation

```graphql
mutation ConfirmOrder {
  confirmOrder(orderId: "order-id") {
    _id
    status
  }
}
```

## Redirect URLs

After payment, users are redirected with the transaction ID:

```
https://shop.example.com/payrexx/success?transactionId=abc123
```

Use this to show appropriate confirmation or error pages.

## Features

- Multiple payment methods (cards, TWINT, PostFinance, etc.)
- Pre-authorization with deferred capture
- Automatic webhook processing
- Price validation
- Reservation cancellation on validation failure

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.payment.payrexx` |
| Type | `GENERIC` |
| Source | [payment/payrexx/](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/payment/payrexx/) |

## Related

- [Plugins Overview](./) - All available plugins
- [Payment Integration Guide](../../guides/payment-integration.md) - Payment setup guide
- [Checkout Implementation](../../guides/checkout-implementation.md) - Complete checkout flow
