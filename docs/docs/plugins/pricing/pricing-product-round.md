---
sidebar_position: 35
title: Product Price Rounding
sidebar_label: Product Rounding
description: Round product prices to configurable precision
---

# Product Price Rounding

Rounds all product pricing calculations to a configurable precision. Typically runs last in the product pricing chain.

## Installation

```typescript
import '@unchainedshop/plugins/pricing/product-round';
```

## How It Works

1. Takes all existing calculation items
2. Rounds each amount to the configured precision
3. Replaces the original calculation with rounded values

## Configuration

Configure the rounding behavior before starting the engine:

```typescript
import { ProductRound } from '@unchainedshop/plugins/pricing/product-round';

// Round to nearest 5 cents (default)
ProductRound.configure({
  defaultPrecision: 5,
});

// Round to nearest 10 cents
ProductRound.configure({
  defaultPrecision: 10,
});

// Custom rounding function (e.g., always round up)
ProductRound.configure({
  defaultPrecision: 5,
  roundTo: (value, precision, currencyCode) => {
    return Math.ceil(value / precision) * precision;
  },
});
```

## Default Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `defaultPrecision` | `5` | Round to nearest 5 cents |
| `roundTo` | Standard rounding | `Math.round(value / precision) * precision` |

## Currency-Specific Rounding

The `roundTo` function receives the currency code, enabling currency-specific logic:

```typescript
ProductRound.configure({
  defaultPrecision: 5,
  roundTo: (value, precision, currencyCode) => {
    if (currencyCode === 'JPY') {
      // Japanese Yen has no decimal places
      return Math.round(value);
    }
    return Math.round(value / precision) * precision;
  },
});
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.product-round` |
| Version | `1.0.0` |
| Order Index | `90` |
| Source | [pricing/product-round.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/product-round.ts) |

## Related

- [Order Price Rounding](./pricing-order-round.md) - Round order totals
- [Product Pricing](../../extend/pricing/product-pricing.md) - Custom product pricing
