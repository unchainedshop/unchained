---
sidebar_position: 3
sidebar_label: Payment Pricing
title: Payment Pricing
description: Custom payment pricing adapters
---

# Payment Pricing

Payment pricing adapters calculate payment fees and adjustments. Compose an object from `PaymentPricingAdapter` and register it with `PaymentPricingDirector`, both exported by `@unchainedshop/core`.

## Invoice Fee

```typescript
import {
  PaymentPricingAdapter,
  PaymentPricingDirector,
  type IPaymentPricingAdapter,
} from '@unchainedshop/core';
import { PaymentProviderType } from '@unchainedshop/core-payment';

const InvoiceFee: IPaymentPricingAdapter = {
  ...PaymentPricingAdapter,
  key: 'my-shop.pricing.invoice-fee',
  version: '1.0.0',
  label: 'Invoice handling fee',
  orderIndex: 10,

  isActivatedFor: ({ provider, currencyCode }) =>
    provider.type === PaymentProviderType.INVOICE && currencyCode === 'CHF',

  actions(params) {
    const pricingAdapter = PaymentPricingAdapter.actions(params);
    return {
      ...pricingAdapter,
      async calculate() {
        pricingAdapter.resultSheet().addFee({
          amount: 500, // CHF 5.00
          isTaxable: true,
          isNetPrice: true,
          meta: { adapter: InvoiceFee.key },
        });
        return pricingAdapter.calculate();
      },
    };
  },
};

PaymentPricingDirector.registerAdapter(InvoiceFee);
```

`addFee` assigns the `PAYMENT` category automatically. Amounts are in the selected currency's smallest unit.

## Percentage Fees and Discounts

For percentage-based fees, obtain the intended base amount through the module and pricing service APIs. Order records are plain data and have no `order.pricing()` method. Define whether the fee applies to products only, includes delivery, or includes tax before choosing the total. Avoid triggering a full order recalculation from a payment pricing adapter, which can recurse into payment pricing.

Select specific gateways with `provider.adapterKey`. Card gateways typically use the `GENERIC` payment provider type; there is no `CARD` provider type.

Use `params.calculationSheet` to inspect preceding payment rows and `pricingAdapter.resultSheet()` for this adapter's contribution. `resultSheet().addDiscount()` adds a discount row and requires a `discountId`, tax flags, and amount. Return `pricingAdapter.calculate()` to pass the accumulated contribution to the director.

## Context Properties

| Property in `params.context` | Description |
|-----------------------------|-------------|
| `provider` | Payment provider |
| `order` | Current order, when available |
| `orderPayment` | Payment record when pricing an order payment |
| `providerContext` | Context supplied for provider simulation |
| `countryCode`, `currencyCode` | Country and currency codes |
| `user` | User, when available |
| `modules`, `services` | Module and service APIs |

## Related

- [Pricing System](../../concepts/pricing-system.md)
- [Product Pricing](./product-pricing.md)
- [Delivery Pricing](./delivery-pricing.md)
- [Payment Plugins](../order-fulfilment/fulfilment-plugins/payment.md)
