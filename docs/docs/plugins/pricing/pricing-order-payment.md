---
sidebar_position: 41
title: Order Payment Pricing
sidebar_label: Order Payment
description: Add payment fees to order total
---

# Order Payment Pricing

Adds the calculated payment fees and taxes to the order total.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/pricing/order-payment';
```

## How It Works

1. Checks if order has a payment method set
2. Creates a PaymentPricingSheet from the payment calculation
3. Extracts gross price and tax sum
4. Adds payment amount and tax to the order pricing sheet

## Prerequisites

- Payment must be selected on the order
- Payment pricing adapters must have calculated the payment fees

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.order-payment` |
| Version | `1.0.0` |
| Order Index | `10` |
| Source | [pricing/order-payment.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/order-payment.ts) |

## Related

- [Order Items](./pricing-order-items.md) - Sum product prices
- [Order Delivery](./pricing-order-delivery.md) - Add delivery fees
- [Payment Pricing](../../extend/pricing/payment-pricing.md) - Custom payment pricing
