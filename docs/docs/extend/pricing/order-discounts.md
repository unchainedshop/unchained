---
sidebar_position: 4
sidebar_label: Order Discounts
title: Order Discounts
description: Custom discount adapters for orders
---

# Order Discounts

Order discount adapters validate coupon codes and automatic promotions. They return configuration for specific pricing adapters, which calculate the monetary adjustment.

## Coupon Example

```typescript
import {
  OrderDiscountAdapter,
  OrderDiscountDirector,
  type IDiscountAdapter,
  type ProductDiscountConfiguration,
} from '@unchainedshop/core';

const SaveTen: IDiscountAdapter<ProductDiscountConfiguration> = {
  ...OrderDiscountAdapter,
  key: 'my-shop.discount.save-ten',
  label: 'Save ten percent',
  version: '1.0.0',
  orderIndex: 10,

  isManualAdditionAllowed: async () => true,
  isManualRemovalAllowed: async () => true,

  async actions({ context }) {
    return {
      ...(await OrderDiscountAdapter.actions({ context })),
      isValidForSystemTriggering: async () => false,
      isValidForCodeTriggering: async ({ code }) => code.toUpperCase() === 'SAVE10',
      discountForPricingAdapterKey({ pricingAdapterKey }) {
        if (pricingAdapterKey === 'shop.unchained.pricing.product-discount') {
          return { rate: 0.1 };
        }
        return null;
      },
    };
  },
};

OrderDiscountDirector.registerAdapter(SaveTen);
```

Load the product discount pricing adapter, either through the base preset or by importing `@unchainedshop/plugins/pricing/product-discount.js`. Return `null` for unrelated pricing adapter keys so the same discount is not applied to products, payment, delivery, and the order independently.

## Automatic Discounts

Return `false` from `isManualAdditionAllowed` and implement `isValidForSystemTriggering` to select eligible orders. The action context is available as `params.context`, including `order`, optional `code` and `orderDiscount`, and `modules`.

For customer-specific promotions, query the user with `context.modules.users.findUserById(context.order.userId)`. The built-in [half-price adapter](../../plugins/pricing/pricing-discount-half-price.md) provides an example based on user tags.

## Minimum Order Values

`discountForPricingAdapterKey` receives the current `calculationSheet` as well as the pricing adapter key. Use that sheet to determine thresholds when returning the discount configuration. The sheet represents the calculation for that particular adapter; a product sheet is not an order total.

For an order-wide fixed amount, target `shop.unchained.pricing.order-discount` and return an `OrderDiscountConfiguration`, such as `{ fixedRate: 10000 }`. The built-in [100-off adapter](../../plugins/pricing/pricing-discount-100-off.md) demonstrates this. Define the currencies for which a fixed amount is valid.

## Usage Reservations

`reserve({ code })` can reserve coupon usage through an application-owned module and return reservation data. `release()` frees that reservation when the discount is removed. Spread the base actions to keep no-op implementations when reservations are unnecessary.

For limited-use coupons, make the reservation atomic in the storage layer. Checking usage and incrementing it in separate operations can allow concurrent checkouts to exceed the limit.

## Adapter Methods

| Method | Contract |
|--------|----------|
| `isManualAdditionAllowed(code?)` | Promise indicating whether a user may add the discount |
| `isManualRemovalAllowed()` | Promise indicating whether a user may remove it |
| `actions({ context })` | Promise of actions for this order |
| `isValidForSystemTriggering()` | Promise indicating automatic eligibility |
| `isValidForCodeTriggering({ code })` | Promise indicating coupon validity |
| `discountForPricingAdapterKey({ pricingAdapterKey, calculationSheet })` | Synchronous configuration or `null` |
| `reserve({ code })` | Promise of reservation data |
| `release()` | Promise resolving after reservation cleanup |

## GraphQL

```graphql
mutation ApplyDiscount($code: String!) {
  addCartDiscount(code: $code) {
    _id
    code
    total {
      amount
      currencyCode
    }
  }
}
```

```graphql
mutation RemoveDiscount($discountId: ID!) {
  removeCartDiscount(discountId: $discountId) {
    _id
  }
}
```

## Related

- [Pricing System](../../concepts/pricing-system.md)
- [Product Pricing](./product-pricing.md)
