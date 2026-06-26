---
sidebar_position: 1
sidebar_label: Product Pricing
title: Product Pricing
description: Custom product pricing adapters
---

# Product Pricing

Product pricing adapters calculate prices when products are queried or added to cart. Use them to implement taxes, surcharges, discounts, rounding, and currency conversion.

For the conceptual overview (the pricing chain, categories, and leveled tiers), see [Pricing System](../../concepts/pricing-system.md).

## Creating an adapter

The recommended way is the [`registerProductPricing`](../plugin-factories.md#pricing) factory. You push rows onto the `sheet`; the factory continues the pricing chain for you — **don't** call the chain yourself.

```typescript
import { registerProductPricing } from '@unchainedshop/core';

registerProductPricing({
  adapterId: 'custom-base',
  orderIndex: 0,
  isActivatedFor: (context) => true, // activate for all products
  calculate: async (sheet, context) => {
    sheet.addItem({
      amount: 1000, // 10.00 in cents
      isTaxable: true,
      isNetPrice: true,
      meta: { adapter: 'custom-base' },
    });
  },
});
```

`calculate(sheet, context)` receives the running pricing `sheet` and the pricing `context` (`product`, `quantity`, `currencyCode`, `countryCode`, …). Run order is controlled by `orderIndex` (lower runs first).

## Examples

### Tax

```typescript
registerProductPricing({
  adapterId: 'swiss-tax',
  orderIndex: 20, // after base price and discounts
  isActivatedFor: (context) => context.countryCode === 'CH',
  calculate: async (sheet) => {
    const taxRate = 0.081; // 8.1% Swiss VAT
    const taxable = sheet.sum({ isTaxable: true });
    if (taxable > 0) {
      sheet.addItem({
        amount: Math.round(taxable * taxRate),
        isTaxable: false,
        isNetPrice: false,
        category: 'TAX',
        meta: { rate: taxRate },
      });
    }
  },
});
```

### Bulk discount

```typescript
registerProductPricing({
  adapterId: 'bulk-discount',
  orderIndex: 10, // after base price, before tax
  calculate: async (sheet, context) => {
    if ((context.quantity ?? 1) >= 10) {
      const base = sheet.sum({ category: 'BASE' });
      sheet.addItem({
        amount: -Math.round(base * 0.1), // 10% off (negative)
        isTaxable: true,
        isNetPrice: true,
        category: 'DISCOUNT',
        meta: { type: 'bulk' },
      });
    }
  },
});
```

:::tip Quantity-tier catalog prices
If you just want different unit prices at different quantities (e.g. cheaper at 10+), you usually don't need a custom adapter — set [leveled catalog prices](../../concepts/pricing-system.md#leveled-quantity-tier-catalog-pricing) (`minQuantity` tiers) on the product instead.
:::

## Low-level adapter (advanced)

For behavior the factory doesn't expose — e.g. **mutating or resetting** existing rows (price rounding, currency conversion across all items) — build the adapter object directly by spreading `ProductPricingAdapter` and registering it with `pluginRegistry.register()`. Inside `actions(params)` you have the full `resultSheet()` and may call the base `calculate()` yourself. See [Plugin System](../../concepts/director-adapter-pattern.md#adapter-contracts).

## Related

- [Pricing System](../../concepts/pricing-system.md) — conceptual overview and leveled tiers
- [Plugin Factories](../plugin-factories.md#pricing) — all four pricing factories
- [Delivery Pricing](./delivery-pricing.md) · [Payment Pricing](./payment-pricing.md) · [Order Discounts](./order-discounts.md)
