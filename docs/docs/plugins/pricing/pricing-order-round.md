---
sidebar_position: 44
title: Order Price Rounding
sidebar_label: Order Rounding
description: Round order totals to configurable precision
---

# Order Price Rounding

Rounds all order pricing categories (items, delivery, payment, discounts, taxes) to a configurable precision. Typically runs last in the order pricing chain.

## Installation

```typescript
import '@unchainedshop/plugins/pricing/order-round';
```

## How It Works

1. Calculates the rounding difference for each category:
   - Items
   - Delivery
   - Payment
   - Discounts
   - Taxes
2. Adds adjustment entries to round each category
3. Maintains tax proportions when rounding

## Configuration

Configure the rounding behavior before starting the engine:

```typescript
import { OrderPriceRound } from '@unchainedshop/plugins/pricing/order-round';

// Round to nearest 5 cents (default)
OrderPriceRound.configure({
  defaultPrecision: 5,
});

// Round to nearest 10 cents
OrderPriceRound.configure({
  defaultPrecision: 10,
});

// Disable rounding
OrderPriceRound.configure({
  defaultPrecision: 0,
});

// Custom rounding function
OrderPriceRound.configure({
  defaultPrecision: 5,
  roundTo: (value, precision, currencyCode) => {
    if (precision === 0) return value;
    return Math.round(value / precision) * precision;
  },
});
```

## Default Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `defaultPrecision` | `5` | Round to nearest 5 cents |
| `roundTo` | Standard rounding | Returns 0 if precision is 0 |

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.order-round` |
| Version | `1.0.0` |
| Order Index | `90` |
| Source | [pricing/order-round.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/order-round.ts) |

## Related

- [Product Price Rounding](./pricing-product-round.md) - Round product prices
- [Pricing System](../../concepts/pricing-system.md) - Pricing overview
