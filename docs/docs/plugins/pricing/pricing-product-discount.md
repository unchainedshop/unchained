---
sidebar_position: 33
title: Product Discount
sidebar_label: Product Discount
description: Apply discounts to product prices
---

# Product Discount

Applies discounts to product-level pricing. Works in conjunction with discount adapters that provide discount configurations.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/pricing/product-discount';
```

## How It Works

1. Iterates through all active discounts on the order
2. For each discount, resolves the configuration (supports custom resolvers)
3. Calculates the discount amount based on the item total
4. Adds discount and tax adjustments to the calculation

## Discount Configuration

Discounts can specify:

| Property | Description |
|----------|-------------|
| `rate` | Percentage discount (0.1 = 10%) |
| `fixedRate` | Fixed amount in cents |
| `isNetPrice` | Whether amount is net (before tax) |
| `taxRate` | Specific tax rate to apply |

## Custom Price Configuration Resolver

Discounts can provide a `customPriceConfigurationResolver` function for dynamic discount logic:

```typescript
const configuration = {
  rate: 0.1,
  customPriceConfigurationResolver: (product, quantity, config) => {
    // Custom logic based on product, quantity, or configuration
    if (product.tags?.includes('sale')) {
      return { rate: 0.2 }; // 20% off sale items
    }
    return { rate: 0.1 }; // 10% off regular items
  },
};
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.product-discount` |
| Version | `1.0.0` |
| Order Index | `30` |
| Source | [pricing/product-discount.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/product-discount.ts) |

## Related

- [Discount Half Price](./pricing-discount-half-price.md) - Example discount adapter
- [Discount 100 Off](./pricing-discount-100-off.md) - Fixed amount discount
- [Order Discounts](../../extend/pricing/order-discounts.md) - Creating custom discounts
