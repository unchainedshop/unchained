---
title: 'Delivery Pricing'
description: Add a delivery pricing plugin
---

Delivery pricing adapter is used to do the actual delivery cost calculation. The adapter is run for every single item included in an order.
in order to add a custom delivery price logic for orders you need to implement [IDeliveryPricingAdapter](https://docs.unchained.shop/types/types/delivery_pricing.IDeliveryPricingAdapter.html).
There can be more than one delivery pricing plugin configurations and all of them will be executed based on their `orderIndex` value. Delivery pricing adapter with lower `orderIndex` will be executed first

below is an example of delivery price for the above delivery adapter that will charge $50  as a delivery fee for orders that use `ShopPickUp` (the above adapter) for their delivery provider.

```typescript

import {
  DeliveryPricingAdapter,
  DeliveryPricingSheet,
  IDeliveryPricingSheet,
} from '@unchainedshop/core-delivery';
import { DeliveryPricingAdapterContext, Calculation, PricingAdapterContext } from '@unchainedshop/types';
import type { IDeliveryPricingAdapter } from '@unchainedshop/types/delivery.pricing.js';
import { Discount } from '@unchainedshop/types/discount.js';

export const ShopDeliveryFreePrice: IDeliveryPricingAdapter = {
  key: 'ch.shop.delivery.pickup-fee',
  version: '1.0.0',
  label: 'Pickup Fee',
  orderIndex: 10,

  isActivatedFor: ({ provider }: DeliveryPricingAdapterContext) => {
    return provider.adapterKey === 'ch.shop.delivery.pickupr';
  },

  actions: (
    context: DeliveryPricingAdapterContext,
    calculationSheet: IDeliveryPricingSheet,
    discounts: Array<Discount>,
  ): IPricingAdapterActions<Calculation, DeliveryPricingAdapterContext> & {
    resultSheet: () => IDeliveryPricingSheet;
  } => {
    const calculation = [];
    const { currency } = context;
    const resultSheet = DeliveryPricingSheet({ currency });
    return {
      getCalculation: (): Calculation[] => calculation,
      getContext: (): DeliveryPricingAdapterContext => context,
      calculate: async (): Promise<Calculation[]> => {
        resultSheet.addFee({
          amount: 50,
          isNetPrice: false,
          isTaxable: true,
          meta: { adapter: 'delivery-price-key' },
        });
        return resultSheet.calculate();
      },
    };
  },
};


```

- **isActivatedFor: [DeliveryPricingAdapterContext](https://docs.unchained.shop/types/interfaces/delivery_pricing.DeliveryPricingAdapterContext.html)**: defines to which delivery adapters this delivery price adapter calculations should take place.
- **getCalculation: [Calculation[]](https://docs.unchained.shop/types/interfaces/pricing.PricingSheetParams.html#calculation)**: returns all the fees that will are included for calculation through the adapter.
- **getContext: [DeliveryPricingAdapterContext](https://docs.unchained.shop/types/interfaces/delivery_pricing.DeliveryPricingAdapterContext.html)**: returns the pricing adapter context
- **calculate: [Calculation[]](https://docs.unchained.shop/types/interfaces/pricing.PricingSheetParams.html#calculation)**: calculated the delivery price based on the logic provided and returns the calculation breakdown (result sheet)
