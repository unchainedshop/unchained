---
sidebar_position: 39
title: Order Items Pricing
sidebar_label: Order Items
description: Sum product prices into order total
---

# Order Items Pricing

Sums up all product item prices and taxes from order positions into the order total. This is the foundation of order-level pricing.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/pricing/order-items';
```

## How It Works

1. Iterates through all order positions
2. For each position, creates a ProductPricingSheet from the calculation
3. Sums the gross price and tax amounts
4. Adds the totals to the order pricing sheet

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.order-items` |
| Version | `1.0.0` |
| Order Index | `0` |
| Source | [pricing/order-items.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/order-items.ts) |

## Related

- [Order Delivery](./pricing-order-delivery.md) - Add delivery fees to order
- [Order Payment](./pricing-order-payment.md) - Add payment fees to order
- [Order Discount](./pricing-order-discount.md) - Apply order-level discounts
