---
sidebar_position: 45
title: Discount 100 Off
sidebar_label: 100 Off Discount
description: Example fixed-amount coupon code discount
---

# Discount 100 Off

A sample discount adapter demonstrating a fixed-amount coupon code (10000 minor units of the order currency, such as 100 CHF). Use this as a template for implementing your own coupon systems.

## Registration

Not part of any preset — register it explicitly:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { HundredOffPlugin } from '@unchainedshop/plugins/pricing/discount-100-off';

pluginRegistry.register(HundredOffPlugin);
```

## How It Works

1. User enters coupon code `100OFF`
2. Adapter validates the code
3. Returns a fixed discount of 10000 minor units to be applied by [Order Discount](./pricing-order-discount.md)

## Coupon Code

| Code | Effect |
|------|--------|
| `100OFF` | 10000 minor units off the total order (case-insensitive; 100.00 for currencies with two decimals) |

## Usage

Apply the discount:

```graphql
mutation ApplyDiscount {
  addCartDiscount(code: "100OFF") {
    _id
    total {
      amount
      currencyCode
    }
  }
}
```

Remove the discount:

```graphql
mutation RemoveDiscount {
  removeCartDiscount(discountId: "discount-id") {
    _id
  }
}
```

## Configuration

The adapter targets `shop.unchained.pricing.order-discount`:

```typescript
discountForPricingAdapterKey: ({ pricingAdapterKey }) => {
  if (pricingAdapterKey === 'shop.unchained.pricing.order-discount') {
    return { fixedRate: 10000 }; // 100.00 for currencies with two decimals
  }
  return null;
},
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.discount.100-off` |
| Version | `1.0.0` |
| Order Index | `10` |
| Manual Addition | Yes |
| Manual Removal | Yes |
| System Triggering | No |
| Source | [pricing/discount-100-off](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/pricing/discount-100-off) |

## Related

- [Discount Half Price Manual](./pricing-discount-half-price-manual.md) - Percentage discount
- [Order Discount](./pricing-order-discount.md) - Order-level discount pricing
- [Order Discounts](../../extend/pricing/order-discounts.md) - Creating custom discounts
