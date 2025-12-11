---
sidebar_position: 45
title: Discount 100 Off
sidebar_label: 100 Off Discount
description: Example fixed-amount coupon code discount
---

# Discount 100 Off

A sample discount adapter demonstrating a fixed-amount coupon code (100 CHF off). Use this as a template for implementing your own coupon systems.

## Installation

```typescript
import '@unchainedshop/plugins/pricing/discount-100-off';
```

## How It Works

1. User enters coupon code `100OFF`
2. Adapter validates the code
3. Returns a fixed discount of 100.00 (10000 cents) to be applied by [Order Discount](./pricing-order-discount.md)

## Coupon Code

| Code | Effect |
|------|--------|
| `100OFF` | 100.00 off total order (case-insensitive) |

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
    return { fixedRate: 10000 }; // 100.00 in cents
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
| Source | [pricing/discount-100-off.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/discount-100-off.ts) |

## Related

- [Discount Half Price](./pricing-discount-half-price.md) - Percentage discount
- [Order Discount](./pricing-order-discount.md) - Order-level discount pricing
- [Order Discounts](../../extend/pricing/order-discounts.md) - Creating custom discounts
