---
sidebar_position: 46
title: Discount Half Price
sidebar_label: Half Price Discount
description: Automatic 50% discount for tagged users
---

# Discount Half Price

A sample discount adapter demonstrating automatic system-triggered discounts. Applies 50% off to users with the `half-price` tag.

## Installation

```typescript
import '@unchainedshop/plugins/pricing/discount-half-price';
```

## How It Works

1. System automatically checks all orders during pricing
2. Looks for users with the `half-price` tag
3. If found, applies 50% off to all products via [Product Discount](./pricing-product-discount.md)

## Eligibility

Users must have the `half-price` tag:

```graphql
mutation TagUser {
  setUserTags(
    userId: "user-id"
    tags: ["half-price"]
  ) {
    _id
    tags
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

## Use Cases

- Employee discounts
- VIP customer pricing
- Partner/affiliate discounts
- Loyalty rewards

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.discount.half-price` |
| Version | `1.0.0` |
| Order Index | `10` |
| Manual Addition | No |
| Manual Removal | No |
| System Triggering | Yes (user tag check) |
| Source | [pricing/discount-half-price.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/discount-half-price.ts) |

## Related

- [Discount Half Price Manual](./pricing-discount-half-price-manual.md) - Code-based version
- [Discount 100 Off](./pricing-discount-100-off.md) - Fixed amount discount
- [Product Discount](./pricing-product-discount.md) - Product-level discounts
