---
sidebar_position: 30
title: Product Catalog Price
sidebar_label: Product Catalog Price
description: Base product pricing from catalog prices
---

# Product Catalog Price

Adds the gross price from the product catalog to the pricing calculation. This is typically the first adapter in the product pricing chain.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/pricing/product-catalog-price';
```

## How It Works

1. Looks up the product price for the given country, currency, and quantity
2. Adds the item total (price × quantity) to the calculation
3. For bundle products, calculates prices from bundled product prices if no direct price exists

## Bundle Product Support

If a product is a `BUNDLE_PRODUCT` and has no direct price configured, the adapter iterates through `product.bundleItems` and sums up the prices of all bundled products.

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.product-price` |
| Version | `1.0.0` |
| Order Index | `0` |
| Source | [pricing/product-catalog-price.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/product-catalog-price.ts) |

## Related

- [Product Catalog Price Options](./pricing-product-catalog-price-options.md) - Add prices for product options
- [Product Discount](./pricing-product-discount.md) - Apply discounts to product prices
- [Product Swiss Tax](./pricing-product-swiss-tax.md) - Apply Swiss VAT
