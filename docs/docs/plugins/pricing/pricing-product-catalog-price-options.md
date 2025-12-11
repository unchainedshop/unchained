---
sidebar_position: 31
title: Product Catalog Price Options
sidebar_label: Product Price Options
description: Add prices for configurable product options
---

# Product Catalog Price Options

Adds prices for product options to the pricing calculation. Used when products have configurable options that affect pricing.

## Installation

```typescript
import '@unchainedshop/plugins/pricing/product-catalog-price-options';
```

## How It Works

1. Reads the `configuration` array from the pricing context
2. Finds all entries with `key: 'option'`
3. Looks up each option product by its ID
4. Adds each option's price to the total

## Configuration Format

Options are passed via the cart item configuration:

```typescript
const configuration = [
  { key: 'option', value: 'product-id-of-option-1' },
  { key: 'option', value: 'product-id-of-option-2' },
];
```

## Use Cases

- Add-on products (e.g., gift wrapping, extended warranty)
- Product customizations with price impact
- Configurable bundles

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.product-price-options` |
| Version | `1.0` |
| Order Index | `1` |
| Source | [pricing/product-catalog-price-options.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/product-catalog-price-options.ts) |

## Related

- [Product Catalog Price](./pricing-product-catalog-price.md) - Base product pricing
- [Product Discount](./pricing-product-discount.md) - Apply discounts
