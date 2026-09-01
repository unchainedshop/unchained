---
sidebar_position: 47
title: Discount Half Price Manual
sidebar_label: Half Price Manual
description: Coupon code for 50% discount on products
---

# Discount Half Price Manual

A sample discount adapter demonstrating a percentage-based coupon code. Applies 50% off to all products when code is entered.

## Registration

Not part of any preset — register it explicitly:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { HalfPriceManualPlugin } from '@unchainedshop/plugins/pricing/discount-half-price-manual';

pluginRegistry.register(HalfPriceManualPlugin);
```

## How It Works

1. User enters coupon code `HALFPRICE`
2. Adapter validates the code
3. Returns 50% discount to be applied by [Product Discount](./pricing-product-discount.md)

## Coupon Code

| Code | Effect |
|------|--------|
| `HALFPRICE` | 50% off all products (case-sensitive) |

## Usage

Apply the discount:

```graphql
mutation ApplyDiscount {
  addCartDiscount(code: "HALFPRICE") {
    _id
    total {
      amount
      currencyCode
    }
  }
}
```

## Configuration

The adapter targets `shop.unchained.pricing.product-discount`:

```typescript
discountForPricingAdapterKey({ pricingAdapterKey }) {
  if (pricingAdapterKey === 'shop.unchained.pricing.product-discount') {
    return { rate: 0.5 }; // 50% off
  }
  return null;
},
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.discount.half-price-manual` |
| Version | `1.0.0` |
| Order Index | `10` |
| Manual Addition | Yes |
| Manual Removal | Yes |
| System Triggering | No |
| Source | [pricing/discount-half-price-manual](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/pricing/discount-half-price-manual) |

## Related

- [Discount 100 Off](./pricing-discount-100-off.md) - Fixed amount discount
- [Order Discounts](../../extend/pricing/order-discounts.md) - Creating custom discounts
