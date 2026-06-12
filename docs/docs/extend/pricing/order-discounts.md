---
sidebar_position: 4
sidebar_label: Order Discounts
title: Order Discounts
description: Custom discount adapters for orders
---

# Order Discounts

Order discount adapters handle coupon codes, promotional discounts, and automatic order-level discounts.

For the conceptual overview, see [Pricing System](../../concepts/pricing-system.md).

## Creating an adapter

Use the [`registerOrderDiscount`](../plugin-factories.md#discounts) factory. The core hook is `discountForPricingAdapterKey` — return a discount configuration, or `null` to not discount.

```typescript
import { registerOrderDiscount } from '@unchainedshop/core';

registerOrderDiscount({
  adapterId: 'save10',
  // apply when the buyer enters a matching code:
  isValidForCodeTriggering: async (code) => code === 'SAVE10',
  discountForPricingAdapterKey: ({ pricingAdapterKey }) =>
    pricingAdapterKey === 'shop.unchained.pricing.order-items' ? { rate: 0.1 } : null,
});
```

| Option | Purpose |
|---|---|
| `isValidForSystemTriggering(context)` | auto-apply without a code (e.g. first-order discount) |
| `isValidForCodeTriggering(code, context)` | apply for a coupon code |
| `discountForPricingAdapterKey(params, context)` | return `{ rate }` / `{ fixedRate }` for a pricing row, or `null` |
| `reserve(code, context)` / `release(context)` | decrement / restore coupon capacity |

## Examples

### Coupon codes

```typescript
const codes = { SAVE10: { rate: 0.1 }, SAVE20: { rate: 0.2 }, DISCOUNT50: { fixedRate: 5000 } };

registerOrderDiscount({
  adapterId: 'coupon',
  isValidForCodeTriggering: async (code) => code in codes,
  discountForPricingAdapterKey: ({ pricingAdapterKey }, context) =>
    pricingAdapterKey === 'shop.unchained.pricing.order-items' ? codes[context.code] ?? null : null,
  reserve: async (code) => db.collection('coupons').updateOne({ code }, { $inc: { usageCount: 1 } }),
  release: async (context) => db.collection('coupons').updateOne({ code: context.code }, { $inc: { usageCount: -1 } }),
});
```

### Automatic first-order discount

```typescript
registerOrderDiscount({
  adapterId: 'first-order',
  isValidForSystemTriggering: async (context) => {
    const previous = await context.modules.orders.count({ userId: context.order.userId, status: { $ne: null } });
    return previous === 0;
  },
  discountForPricingAdapterKey: ({ pricingAdapterKey }) =>
    pricingAdapterKey === 'shop.unchained.pricing.order-items' ? { rate: 0.15 } : null,
});
```

## Discount configuration

Returned from `discountForPricingAdapterKey`:

| Property | Description |
|---|---|
| `rate` | Percentage discount (`0.1` = 10%) |
| `fixedRate` | Fixed amount in cents (`5000` = 50.00) |

> For fine-grained control of manual code entry/removal (`isManualAdditionAllowed` / `isManualRemovalAllowed`), build the adapter directly by spreading `OrderDiscountAdapter` and registering it via `pluginRegistry.register()`. See [Plugin System](../../concepts/director-adapter-pattern.md#adapter-contracts).

## GraphQL

```graphql
mutation ApplyDiscount($code: String!) {
  addCartDiscount(code: $code) { _id code total { amount currencyCode } }
}

mutation RemoveDiscount($discountId: ID!) {
  removeCartDiscount(discountId: $discountId) { _id }
}
```

## Related

- [Pricing System](../../concepts/pricing-system.md) — conceptual overview
- [Plugin Factories](../plugin-factories.md#discounts) — `registerOrderDiscount` / `registerProductDiscount`
- [Product Pricing](./product-pricing.md)
