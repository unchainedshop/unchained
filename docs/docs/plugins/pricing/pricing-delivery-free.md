---
sidebar_position: 36
title: Free Delivery Pricing
sidebar_label: Free Delivery
description: Zero-cost delivery pricing adapter
---

# Free Delivery Pricing

A simple delivery pricing adapter that sets delivery fees to zero. Use as a starting point or for delivery methods that don't charge shipping.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/pricing/free-delivery';
```

## How It Works

Adds a delivery fee of 0 to the calculation, with no tax implications.

## Use Cases

- Digital products / downloads
- Local pickup
- Free shipping promotions (when combined with conditional logic)
- Development and testing

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.delivery-free` |
| Version | `1.0.0` |
| Order Index | `0` |
| Source | [pricing/free-delivery.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/free-delivery.ts) |

## Related

- [Delivery Swiss Tax](./pricing-delivery-swiss-tax.md) - Add Swiss VAT to delivery
- [Delivery Pricing](../../extend/pricing/delivery-pricing.md) - Custom delivery pricing
