---
sidebar_position: 3
sidebar_label: Payment Pricing
title: Payment Pricing
description: Custom payment pricing adapters
---

# Payment Pricing

Payment pricing adapters calculate fees for different payment methods — e.g. credit-card processing fees or invoice handling charges.

For the conceptual overview, see [Pricing System](../../concepts/pricing-system.md).

## Creating an adapter

Use the [`registerPaymentPricing`](../plugin-factories.md#pricing) factory. Push fees onto the `sheet` with `addFee(...)`; the factory continues the chain for you.

```typescript
import { registerPaymentPricing } from '@unchainedshop/core';

registerPaymentPricing({
  adapterId: 'invoice-fee',
  isActivatedFor: (context) => context.provider?.type === 'INVOICE',
  calculate: async (sheet) => {
    sheet.addFee({ amount: 500, isTaxable: true, isNetPrice: true, meta: { type: 'invoice' } });
  },
});
```

`calculate(sheet, context)` receives the running `sheet` and the payment pricing `context` (`provider`, `order`, `modules`, `currencyCode`).

## Examples

### Credit-card fee

```typescript
registerPaymentPricing({
  adapterId: 'card-fee',
  isActivatedFor: (context) => ['CARD', 'GENERIC'].includes(context.provider?.type),
  calculate: async (sheet, context) => {
    const orderTotal = context.order.pricing().total().amount;
    const fee = Math.round(orderTotal * 0.029 + 30); // 2.9% + 0.30
    sheet.addFee({ amount: fee, isTaxable: false, isNetPrice: true, meta: { rate: 0.029, fixed: 30 } });
  },
});
```

### Tiered processing fee

```typescript
registerPaymentPricing({
  adapterId: 'tiered-fee',
  isActivatedFor: (context) => context.provider?.type === 'CARD',
  calculate: async (sheet, context) => {
    const orderTotal = context.order.pricing().total().amount;
    const rate = orderTotal >= 50000 ? 0.019 : orderTotal >= 10000 ? 0.025 : 0.029;
    sheet.addFee({ amount: Math.round(orderTotal * rate + 30), isTaxable: false, isNetPrice: true, meta: { rate } });
  },
});
```

## Low-level adapter (advanced)

For behavior the factory doesn't expose, build the adapter by spreading `PaymentPricingAdapter` and registering it via `pluginRegistry.register()`. See [Plugin System](../../concepts/director-adapter-pattern.md#adapter-contracts).

## Related

- [Pricing System](../../concepts/pricing-system.md) — conceptual overview
- [Plugin Factories](../plugin-factories.md#pricing) — all four pricing factories
- [Product Pricing](./product-pricing.md) · [Delivery Pricing](./delivery-pricing.md) · [Payment Plugins](../order-fulfilment/fulfilment-plugins/payment.md)
