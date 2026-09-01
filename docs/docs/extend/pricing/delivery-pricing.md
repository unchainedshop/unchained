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

`calculate(sheet, context)` receives a fresh result sheet for this adapter (it contains only the rows you add) and the delivery pricing `context` (`provider`, `order`, `orderDelivery`, `currencyCode`).

## Examples

### Zone-based pricing

```typescript
registerDeliveryPricing({
  adapterId: 'zone-shipping',
  isActivatedFor: (context) => context.provider?.type === 'SHIPPING',
  calculate: async (sheet, context) => {
    const zoneRates = { CH: 800, DE: 1500, AT: 1500, FR: 1500, IT: 1500, default: 2500 };
    // shipping address is stored on the order delivery; fall back to the billing address
    const countryCode =
      context.orderDelivery?.context?.address?.countryCode ??
      context.order?.billingAddress?.countryCode;
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

Your `sheet` never contains rows of other adapters, so read the order item total from the order's last calculation instead and skip the fee above the threshold:

```typescript
import { OrderPricingSheet, registerDeliveryPricing } from '@unchainedshop/core';

registerDeliveryPricing({
  adapterId: 'threshold-shipping',
  isActivatedFor: (context) => context.provider?.type === 'SHIPPING',
  calculate: async (sheet, context) => {
    const itemsTotal = OrderPricingSheet({
      calculation: context.order?.calculation ?? [],
      currencyCode: context.currencyCode,
    }).total({ category: 'ITEMS' }).amount;

    if (itemsTotal < 10000) {
      // 8.00 shipping below 100.00, free above
      sheet.addFee({ amount: 800, isTaxable: true, isNetPrice: true, meta: { threshold: 10000 } });
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
