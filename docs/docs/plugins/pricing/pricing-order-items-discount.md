---
sidebar_position: 42
title: Order Items Discount
sidebar_label: Order Items Discount
description: Apply discounts to order item totals only
---

# Order Items Discount

Applies discounts to the total value of goods (items only), excluding delivery and payment fees. Use this for discounts that should only affect product prices.

## Installation

```typescript
import '@unchainedshop/plugins/pricing/order-items-discount';
```

## How It Works

1. Calculates the total amount of all order items
2. Determines each item's share of the total (for proportional tax calculation)
3. For each discount, calculates the discount amount
4. Distributes the discount proportionally across items
5. Adds discount and tax adjustments to the order pricing

## Discount Distribution

Discounts are distributed proportionally across items to maintain correct tax calculations:

```
Item A: 60 CHF (60% of total)
Item B: 40 CHF (40% of total)
Discount: 10 CHF

Item A discount: 6 CHF
Item B discount: 4 CHF
```

## Difference from Order Discount

| Adapter | Applies To |
|---------|------------|
| Order Items Discount | Products only |
| Order Discount | Products + Delivery + Payment |

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.order-items-discount` |
| Version | `1.0.0` |
| Order Index | `30` |
| Source | [pricing/order-items-discount.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/order-items-discount.ts) |

## Related

- [Order Discount](./pricing-order-discount.md) - Discounts on full order
- [Product Discount](./pricing-product-discount.md) - Product-level discounts
- [Order Discounts](../../extend/pricing/order-discounts.md) - Creating custom discounts
