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
  adapterId: 'automatic-save10',
  // Apply to every eligible cart without requiring a code:
  isValidForSystemTriggering: async () => true,
  discountForPricingAdapterKey: ({ pricingAdapterKey }) =>
    pricingAdapterKey === 'shop.unchained.pricing.order-discount' ? { rate: 0.1 } : null,
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

Manual coupons need `isManualAdditionAllowed` and `isManualRemovalAllowed`. The order-discount factory inherits `false` for these flags, so define a full adapter when customers should enter and remove codes:

```typescript
import {
  OrderDiscountAdapter,
  pluginRegistry,
  type IDiscountAdapter,
  type OrderDiscountConfiguration,
} from '@unchainedshop/core';

const codes = { SAVE10: { rate: 0.1 }, SAVE20: { rate: 0.2 }, DISCOUNT50: { fixedRate: 5000 } };

const Coupons: IDiscountAdapter<OrderDiscountConfiguration> = {
  ...OrderDiscountAdapter,
  key: 'com.example.discount.coupons',
  label: 'Coupon codes',
  version: '1.0.0',
  isManualAdditionAllowed: async () => true,
  isManualRemovalAllowed: async () => true,
  actions: async ({ context }) => ({
    ...(await OrderDiscountAdapter.actions({ context })),
    isValidForCodeTriggering: async ({ code }) => Object.hasOwn(codes, code),
    discountForPricingAdapterKey: ({ pricingAdapterKey }) =>
      pricingAdapterKey === 'shop.unchained.pricing.order-discount'
        ? codes[context.code ?? ''] ?? null
        : null,
  }),
};

pluginRegistry.register({
  key: Coupons.key,
  label: Coupons.label,
  version: Coupons.version,
  adapters: [Coupons],
});
```

### Automatic first-order discount

```typescript
registerOrderDiscount({
  adapterId: 'first-order',
  isValidForSystemTriggering: async (context) => {
    const previous = await ordersRepository.countConfirmedForUser(context.order.userId);
    return previous === 0;
  },
  discountForPricingAdapterKey: ({ pricingAdapterKey }) =>
    pricingAdapterKey === 'shop.unchained.pricing.order-discount' ? { rate: 0.15 } : null,
});
```

## Discount configuration

Returned from `discountForPricingAdapterKey`:

| Property | Description |
|---|---|
| `rate` | Percentage discount (`0.1` = 10%) |
| `fixedRate` | Fixed amount in the order currency's minor units (`5000` = 50.00 for a currency with two decimals) |

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
