---
sidebar_position: 4
sidebar_label: Order Discounts
title: Order Discounts
description: Custom discount adapters for orders
---

# Order Discounts

Order discount adapters handle coupon codes, promotional discounts, and automatic order-level discounts.

For conceptual overview, see [Pricing System](../../concepts/pricing-system.md).

## Creating an Adapter

Register a discount adapter with `OrderDiscountDirector`:

```typescript
import { OrderDiscountDirector, type IDiscountAdapter } from '@unchainedshop/core';

const MyDiscount: IDiscountAdapter = {
  key: 'my-shop.discount.custom',
  label: 'Custom Discount',
  version: '1.0.0',
  orderIndex: 0,

  isManualAdditionAllowed(code) {
    return true; // Allow users to enter this discount code
  },

  isManualRemovalAllowed() {
    return true; // Allow users to remove this discount
  },

  actions(context) {
    return {
      isValidForSystemTriggering() {
        return false; // Don't auto-apply
      },

      isValidForCodeTriggering(code) {
        return code === 'SAVE10';
      },

      discountForPricingAdapterKey({ pricingAdapterKey }) {
        return { rate: 0.1 }; // 10% off
      },

      async reserve(code) {
        // Optional: Track usage
      },

      async release() {
        // Optional: Release reservation on cancellation
      },
    };
  },
};

OrderDiscountDirector.registerAdapter(MyDiscount);
```

## Examples

### Coupon Code Discount

```typescript
const CouponDiscount: IDiscountAdapter = {
  key: 'my-shop.discount.coupon',
  label: 'Coupon Code',
  version: '1.0.0',
  orderIndex: 0,

  isManualAdditionAllowed(code) {
    // Accept codes starting with 'SAVE' or 'DISCOUNT'
    return code?.startsWith('SAVE') || code?.startsWith('DISCOUNT');
  },

  isManualRemovalAllowed() {
    return true;
  },

  actions(context) {
    const validCodes = {
      SAVE10: { rate: 0.1 },
      SAVE20: { rate: 0.2 },
      DISCOUNT50: { fixedRate: 5000 }, // 50.00 off
    };

    return {
      isValidForSystemTriggering() {
        return false;
      },

      isValidForCodeTriggering(code) {
        return code in validCodes;
      },

      discountForPricingAdapterKey({ code }) {
        return validCodes[code] || null;
      },

      async reserve(code) {
        // Decrement coupon usage count
        await db.collection('coupons').updateOne(
          { code },
          { $inc: { usageCount: 1 } }
        );
      },

      async release() {
        // Increment back on cancellation
        const { code } = context.orderDiscount;
        await db.collection('coupons').updateOne(
          { code },
          { $inc: { usageCount: -1 } }
        );
      },
    };
  },
};
```

### Automatic First-Order Discount

```typescript
const FirstOrderDiscount: IDiscountAdapter = {
  key: 'my-shop.discount.first-order',
  label: 'First Order Discount',
  version: '1.0.0',
  orderIndex: 1,

  isManualAdditionAllowed() {
    return false; // Auto-applied only
  },

  isManualRemovalAllowed() {
    return false;
  },

  actions(context) {
    const { order, modules } = context;

    return {
      async isValidForSystemTriggering() {
        // Check if this is the user's first order
        const previousOrders = await modules.orders.count({
          userId: order.userId,
          status: { $ne: null }, // Exclude carts
        });
        return previousOrders === 0;
      },

      isValidForCodeTriggering() {
        return false;
      },

      discountForPricingAdapterKey() {
        return { rate: 0.15 }; // 15% off first order
      },

      async reserve() {},
      async release() {},
    };
  },
};
```

### Minimum Order Value Discount

```typescript
const MinimumOrderDiscount: IDiscountAdapter = {
  key: 'my-shop.discount.minimum-order',
  label: 'Spend More Save More',
  version: '1.0.0',
  orderIndex: 2,

  isManualAdditionAllowed() {
    return false;
  },

  isManualRemovalAllowed() {
    return false;
  },

  actions(context) {
    const { order } = context;

    return {
      async isValidForSystemTriggering() {
        const total = order.pricing().total().amount;
        return total >= 10000; // Minimum 100.00
      },

      isValidForCodeTriggering() {
        return false;
      },

      discountForPricingAdapterKey() {
        const total = order.pricing().total().amount;

        // Tiered discounts
        if (total >= 50000) {
          return { rate: 0.15 }; // 15% off for 500+
        } else if (total >= 25000) {
          return { rate: 0.1 }; // 10% off for 250+
        } else if (total >= 10000) {
          return { rate: 0.05 }; // 5% off for 100+
        }

        return null;
      },

      async reserve() {},
      async release() {},
    };
  },
};
```

### Limited-Use Coupon

```typescript
const LimitedCoupon: IDiscountAdapter = {
  key: 'my-shop.discount.limited',
  label: 'Limited Coupon',
  version: '1.0.0',
  orderIndex: 0,

  isManualAdditionAllowed(code) {
    return code?.startsWith('LIMITED');
  },

  isManualRemovalAllowed() {
    return true;
  },

  actions(context) {
    return {
      isValidForSystemTriggering() {
        return false;
      },

      async isValidForCodeTriggering(code) {
        // Check if coupon exists and has remaining uses
        const coupon = await db.collection('coupons').findOne({ code });
        if (!coupon) return false;
        return coupon.usageCount < coupon.maxUsage;
      },

      discountForPricingAdapterKey({ code }) {
        return { rate: 0.25 }; // 25% off
      },

      async reserve(code) {
        await db.collection('coupons').updateOne(
          { code },
          { $inc: { usageCount: 1 } }
        );
      },

      async release() {
        const { code } = context.orderDiscount;
        await db.collection('coupons').updateOne(
          { code },
          { $inc: { usageCount: -1 } }
        );
      },
    };
  },
};
```

## Adapter Methods

| Method | Description |
|--------|-------------|
| `isManualAdditionAllowed(code)` | Can users add this discount with a code? |
| `isManualRemovalAllowed()` | Can users remove this discount? |
| `isValidForSystemTriggering()` | Should this discount auto-apply? |
| `isValidForCodeTriggering(code)` | Is this code valid? |
| `discountForPricingAdapterKey()` | Return discount configuration |
| `reserve(code)` | Called when discount is applied |
| `release()` | Called when order is cancelled |

## Discount Configuration

Return from `discountForPricingAdapterKey`:

| Property | Description |
|----------|-------------|
| `rate` | Percentage discount (0.1 = 10%) |
| `fixedRate` | Fixed amount in cents (5000 = 50.00) |

## GraphQL

Apply discount:

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

Remove discount:

```graphql
mutation RemoveDiscount($discountId: ID!) {
  removeCartDiscount(discountId: $discountId) {
    _id
  }
}
```

## Related

- [Pricing System](../../concepts/pricing-system.md) - Conceptual overview
- [Product Pricing](./product-pricing.md) - Product-level discounts
