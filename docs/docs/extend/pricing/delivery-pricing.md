---
sidebar_position: 2
sidebar_label: Delivery Pricing
title: Delivery Pricing
description: Custom delivery pricing adapters
---

# Delivery Pricing

Delivery pricing adapters calculate shipping and handling fees. Compose an object from `DeliveryPricingAdapter` and register it with `DeliveryPricingDirector`, both exported by `@unchainedshop/core`.

## Weight-Based Shipping

```typescript
import {
  DeliveryPricingAdapter,
  DeliveryPricingDirector,
  type IDeliveryPricingAdapter,
} from '@unchainedshop/core';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';

const WeightBasedShipping: IDeliveryPricingAdapter = {
  ...DeliveryPricingAdapter,
  key: 'my-shop.pricing.weight-shipping',
  version: '1.0.0',
  label: 'Weight-based shipping',
  orderIndex: 10,

  isActivatedFor: ({ provider, currencyCode }) =>
    provider.type === DeliveryProviderType.SHIPPING && currencyCode === 'CHF',

  actions(params) {
    const pricingAdapter = DeliveryPricingAdapter.actions(params);
    return {
      ...pricingAdapter,
      async calculate() {
        const { order, modules } = params.context;
        if (!order) return pricingAdapter.calculate();

        const positions = await modules.orders.positions.findOrderPositions({
          orderId: order._id,
        });
        let totalWeightGrams = 0;
        for (const position of positions) {
          const product = await modules.products.findProduct({ productId: position.productId });
          totalWeightGrams += (product?.supply?.weightInGram || 0) * position.quantity;
        }

        pricingAdapter.resultSheet().addFee({
          amount: 500 + Math.round((totalWeightGrams / 1000) * 200),
          isTaxable: true,
          isNetPrice: true,
          meta: { adapter: WeightBasedShipping.key, totalWeightGrams },
        });
        return pricingAdapter.calculate();
      },
    };
  },
};

DeliveryPricingDirector.registerAdapter(WeightBasedShipping);
```

The example adds CHF 5.00 plus CHF 2.00 per kilogram. `addFee` assigns the `DELIVERY` category automatically. Position quantities and weights come from the module APIs; order records do not contain an `items` array.

## Other Shipping Rules

- **Zones:** Read the delivery address from `params.context.orderDelivery?.context?.address` during checkout, or `params.context.providerContext` for provider simulation. Do not read a nested delivery object from the order record.
- **Express delivery:** Select a provider by `provider.adapterKey` in `isActivatedFor` and calculate its fee with `resultSheet().addFee()`.
- **Free shipping:** Read order positions with `modules.orders.positions.findOrderPositions`, calculate their totals with the pricing services, and skip or replace the delivery fee when the threshold is reached. Avoid counting only the first calculation row; discounts and taxes can span multiple rows.

`params.calculationSheet` contains earlier delivery pricing rows. To replace them, call `pricingAdapter.resultSheet().resetCalculation(params.calculationSheet)` before adding the replacement fee. Use this deliberately because it also offsets prior tax and discount rows.

## Context Properties

| Property in `params.context` | Description |
|-----------------------------|-------------|
| `provider` | Delivery provider |
| `order` | Current order, when available |
| `orderDelivery` | Delivery record when pricing an order delivery |
| `providerContext` | Context supplied for provider simulation |
| `countryCode`, `currencyCode` | Country and currency codes |
| `user` | User |
| `modules`, `services` | Module and service APIs |

## Related

- [Pricing System](../../concepts/pricing-system.md)
- [Product Pricing](./product-pricing.md)
- [Payment Pricing](./payment-pricing.md)
- [Delivery Plugins](../order-fulfilment/fulfilment-plugins/delivery.md)
