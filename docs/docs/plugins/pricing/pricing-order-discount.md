---
sidebar_position: 43
title: Order Discount
sidebar_label: Order Discount
description: Apply discounts to total order value
---

# Order Discount

Applies discounts to the total order value, including items, delivery, and payment fees. This is the most comprehensive discount type.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/pricing/order-discount';
```

## How It Works

1. Calculates totals for items, delivery, and payment
2. Determines proportional shares for each category
3. For each discount:
   - First applies to items (up to items total)
   - Remaining discount applies to delivery and payment
4. Distributes discounts proportionally for correct tax calculation
5. Adds discount and tax adjustments to the order pricing

## Discount Distribution Example

```
Items Total: 80 CHF
Delivery: 15 CHF
Payment: 5 CHF
Order Total: 100 CHF

10% Discount (10 CHF):
- Items: 8 CHF
- Delivery: 1.50 CHF
- Payment: 0.50 CHF
```

## Fixed Rate Handling

For fixed-rate discounts that exceed the items total:

```
Items Total: 50 CHF
Delivery: 20 CHF
Fixed Discount: 60 CHF

Result:
- Items discount: 50 CHF (full amount)
- Delivery discount: 10 CHF (remaining)
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.order-discount` |
| Version | `1.0.0` |
| Order Index | `40` |
| Source | [pricing/order-discount.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/order-discount.ts) |

## Related

- [Order Items Discount](./pricing-order-items-discount.md) - Items-only discounts
- [Discount 100 Off](./pricing-discount-100-off.md) - Example fixed discount
- [Order Discounts](../../extend/pricing/order-discounts.md) - Creating custom discounts
