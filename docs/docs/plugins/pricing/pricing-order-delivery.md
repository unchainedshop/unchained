---
sidebar_position: 40
title: Order Delivery Pricing
sidebar_label: Order Delivery
description: Add delivery fees to order total
---

# Order Delivery Pricing

Adds the calculated delivery fees and taxes to the order total.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/pricing/order-delivery';
```

## How It Works

1. Checks if order has a delivery method set
2. Creates a DeliveryPricingSheet from the delivery calculation
3. Extracts gross price and tax sum
4. Adds delivery amount and tax to the order pricing sheet

## Prerequisites

- Delivery must be selected on the order
- Delivery pricing adapters must have calculated the delivery fees

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.order-delivery` |
| Version | `1.0.0` |
| Order Index | `10` |
| Source | [pricing/order-delivery.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/order-delivery.ts) |

## Related

- [Order Items](./pricing-order-items.md) - Sum product prices
- [Order Payment](./pricing-order-payment.md) - Add payment fees
- [Delivery Pricing](../../extend/pricing/delivery-pricing.md) - Custom delivery pricing
