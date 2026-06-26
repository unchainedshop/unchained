---
sidebar_position: 2
sidebar_label: Delivery Pricing
title: Delivery Pricing
description: Custom delivery pricing adapters
---

# Delivery Pricing

Delivery pricing adapters calculate shipping and handling fees based on order contents, delivery method, and destination.

For the conceptual overview, see [Pricing System](../../concepts/pricing-system.md).

## Creating an adapter

Use the [`registerDeliveryPricing`](../plugin-factories.md#pricing) factory. Push fees onto the `sheet` with `addFee(...)`; the factory continues the chain for you.

```typescript
import { registerDeliveryPricing } from '@unchainedshop/core';

registerDeliveryPricing({
  adapterId: 'flat-rate',
  isActivatedFor: (context) => context.provider?.type === 'SHIPPING',
  calculate: async (sheet, context) => {
    sheet.addFee({ amount: 800, isTaxable: true, isNetPrice: true, meta: { adapter: 'flat-rate' } });
  },
});
```

`calculate(sheet, context)` receives the running `sheet` and the delivery pricing `context` (`provider`, `order`, `modules`, `currencyCode`).

## Examples

### Zone-based pricing

```typescript
registerDeliveryPricing({
  adapterId: 'zone-shipping',
  isActivatedFor: (context) => context.provider?.type === 'SHIPPING',
  calculate: async (sheet, context) => {
    const zoneRates = { CH: 800, DE: 1500, AT: 1500, FR: 1500, IT: 1500, default: 2500 };
    const countryCode = context.order?.delivery?.address?.countryCode;
    sheet.addFee({
      amount: zoneRates[countryCode] ?? zoneRates.default,
      isTaxable: true,
      isNetPrice: true,
      meta: { zone: countryCode },
    });
  },
});
```

### Free-shipping threshold

```typescript
registerDeliveryPricing({
  adapterId: 'free-shipping',
  orderIndex: 10, // after base shipping
  calculate: async (sheet, context) => {
    const productTotal = sheet.sum({ category: 'ITEMS' }); // order item total
    const deliveryTotal = sheet.sum({ category: 'DELIVERY' });
    if (productTotal >= 10000 && deliveryTotal > 0) {
      sheet.addDiscount({ amount: -deliveryTotal, isTaxable: true, isNetPrice: true, discountId: 'free-shipping', meta: { threshold: 10000 } });
    }
  },
});
```

## Low-level adapter (advanced)

For behavior the factory doesn't expose, build the adapter by spreading `DeliveryPricingAdapter` and registering it via `pluginRegistry.register()`. See [Plugin System](../../concepts/director-adapter-pattern.md#adapter-contracts).

## Related

- [Pricing System](../../concepts/pricing-system.md) — conceptual overview
- [Plugin Factories](../plugin-factories.md#pricing) — all four pricing factories
- [Product Pricing](./product-pricing.md) · [Payment Pricing](./payment-pricing.md) · [Delivery Plugins](../order-fulfilment/fulfilment-plugins/delivery.md)
