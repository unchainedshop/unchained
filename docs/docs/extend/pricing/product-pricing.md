---
sidebar_position: 1
sidebar_label: Product Pricing
title: Product Pricing
description: Custom product pricing adapters
---

# Product Pricing

Product pricing adapters calculate prices when products are queried or added to a cart. They can add catalog prices, adjustments, taxes, rounding, and currency conversion.

## Creating an Adapter

Compose an object from `ProductPricingAdapter` and register it with `ProductPricingDirector`. Both are exported by `@unchainedshop/core`.

```typescript
import {
  ProductPricingAdapter,
  ProductPricingDirector,
  type IProductPricingAdapter,
} from '@unchainedshop/core';

const ProductSurcharge: IProductPricingAdapter = {
  ...ProductPricingAdapter,
  key: 'my-shop.pricing.surcharge',
  version: '1.0.0',
  label: 'Product surcharge',
  orderIndex: 10,

  isActivatedFor: ({ currencyCode }) => currencyCode === 'CHF',

  actions(params) {
    const pricingAdapter = ProductPricingAdapter.actions(params);
    return {
      ...pricingAdapter,
      async calculate() {
        pricingAdapter.resultSheet().addItem({
          amount: 100 * params.context.quantity, // CHF 1.00 per unit
          isTaxable: true,
          isNetPrice: true,
          meta: { adapter: ProductSurcharge.key },
        });
        return pricingAdapter.calculate();
      },
    };
  },
};

ProductPricingDirector.registerAdapter(ProductSurcharge);
```

This adds to any preceding catalog price. Amounts are in the currency's smallest unit and apply to the complete requested quantity. `addItem` assigns the `ITEM` category automatically.

## Reading and Replacing Prior Calculations

`params.calculationSheet` contains the preceding adapters' rows. The adapter's `resultSheet()` holds only its own contribution. Read totals with `sum()` or `total()`; return the contribution with `pricingAdapter.calculate()`.

To replace prior rows, add their inverse to the result sheet before adding the replacement:

```typescript
// Inside actions(params), after creating pricingAdapter:
const result = pricingAdapter.resultSheet();
result.resetCalculation(params.calculationSheet);
result.addItem({
  amount: 900 * params.context.quantity,
  isTaxable: true,
  isNetPrice: true,
  meta: { adapter: 'my-shop.pricing.replacement' },
});
```

For tax-aware rounding and conversion, follow the built-in [product rounding](../../plugins/pricing/pricing-product-round.md) and [rate conversion](../../plugins/pricing/pricing-product-rate-conversion.md) adapters. They preserve each row's tax information when replacing prices. Use the country tax presets for destination-specific tax calculation.

## Adapter Properties

| Property | Description |
|----------|-------------|
| `key` | Unique identifier |
| `version` | Adapter version |
| `label` | Human-readable name |
| `orderIndex` | Execution order, lower values first |
| `isActivatedFor(context)` | Selects the pricing contexts this adapter handles |
| `actions(params)` | Creates the calculation actions for a single invocation |

## Context Properties

Available in `params.context`:

| Property | Description |
|----------|-------------|
| `product` | Product being priced |
| `quantity` | Requested quantity |
| `currencyCode` | Target currency code |
| `countryCode` | Target country code |
| `configuration` | Product configuration |
| `order`, `user` | Order and user when available |
| `modules`, `services` | Unchained module and service APIs |

Resolved discount configurations are passed separately as `params.discounts`.

## Related

- [Pricing System](../../concepts/pricing-system.md)
- [Custom Pricing](../../guides/custom-pricing.md)
- [Delivery Pricing](./delivery-pricing.md)
- [Payment Pricing](./payment-pricing.md)
- [Order Discounts](./order-discounts.md)
