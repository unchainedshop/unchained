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

`calculate(sheet, context)` receives a fresh result sheet for this adapter — it contains only the rows *you* add (`amount` is the total for `context.quantity`) — and the pricing `context` (`product`, `quantity`, `currencyCode`, `countryCode`, …). Adapters run in ascending `orderIndex`; registration order only breaks ties.

`addItem` always writes an `ITEM` row; the other row categories (`DISCOUNT`, `TAX`) have their own methods (`addDiscount`, `addTax`).

:::tip Quantity-tier catalog prices
If you just want different unit prices at different quantities (e.g. cheaper at 10+), you usually don't need a custom adapter — set [leveled catalog prices](../../concepts/pricing-system.md#leveled-quantity-tier-catalog-pricing) (`minQuantity` tiers) on the product instead.
:::

## Reading rows of earlier adapters (taxes, discounts)

Adapters that derive rows from what the chain has produced so far — taxes on the taxable total, a percentage off the base price — can't use the factory: its `sheet` never contains other adapters' rows. Build the adapter object directly; inside `actions(params)` you get the running `params.calculationSheet` (all rows from earlier adapters) alongside your own `resultSheet()`:

```typescript
import {
  ProductPricingAdapter,
  pluginRegistry,
  type IProductPricingAdapter,
} from '@unchainedshop/core';

const SwissTax: IProductPricingAdapter = {
  ...ProductPricingAdapter,

  key: 'com.example.pricing.swiss-tax',
  label: 'Swiss VAT (simplified)',
  version: '1.0.0',
  orderIndex: 20, // after the catalog price (0), before the built-in taxes (80)

  isActivatedFor: (context) => context.countryCode === 'CH',

  actions: (params) => {
    const pricingAdapter = ProductPricingAdapter.actions(params);

    return {
      ...pricingAdapter,
      calculate: async () => {
        const taxRate = 0.081; // 8.1% Swiss VAT
        // sum the taxable rows added by earlier adapters
        const taxable = params.calculationSheet.sum({ isTaxable: true });
        if (taxable !== 0) {
          pricingAdapter.resultSheet().addTax({
            amount: Math.round(taxable * taxRate),
            rate: taxRate,
          });
        }
        return pricingAdapter.calculate();
      },
    };
  },
};

pluginRegistry.register({
  key: SwissTax.key,
  label: SwissTax.label,
  version: SwissTax.version,
  adapters: [SwissTax],
});
```

This example assumes net prices. The shipped country tax plugins (`product-swiss-tax`, `product-eu-tax`, …) implement the full net/gross handling and per-product tax categories — prefer them over rolling your own.

## Related

- [Pricing System](../../concepts/pricing-system.md) — conceptual overview and leveled tiers
- [Plugin Factories](../plugin-factories.md#pricing) — all four pricing factories
- [Delivery Pricing](./delivery-pricing.md) · [Payment Pricing](./payment-pricing.md) · [Order Discounts](./order-discounts.md)
