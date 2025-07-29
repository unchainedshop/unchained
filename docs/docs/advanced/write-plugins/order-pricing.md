---
sidebar_position: 6
sidebar_label: Order pricing
title: Order Pricing
---
:::info
Add an order pricing plugin
:::


Order price adapter gives you more control on how you charge based on an order. In order to add custom order pricing logic you first need to implement [IPricingAdapter](https://docs.unchained.shop/types/types/pricing.IPricingAdapter.html)  and register is to the global **OrderPricingDirector** which implements the [IPricingDirector](https://docs.unchained.shop/types/types/pricing.IPricingDirector.html).

There can be more than one order pricing plugin configurations and all of them will be executed based on there `orderIndex` value. Order pricing adapter with lower `orderIndex` will be executed first 

below is an example or IPricingAdapter implementation that will add $50 to each order as service charge


```typescript
export const ShopOrderPricingAdapter: IOrderPricingAdapter = {
  key: 'shop-order-service-pricing',
  label: 'Default service charge price',
  version: '1.0.0',
  orderIndex: 1,

  isActivatedFor: (context) => {
    return true;
  },

  actions: (params) => {
    const calculation: OrderPricingCalculation[] = [];
    const { context } = params;
    const { currencyCode } = context;
    const resultSheet = OrderPricingSheet({ currencyCode });

    return {
      calculate: async () => {
        const resultRaw = resultSheet.getRawPricingSheet();
        resultSheet.addPayment({ amount: 100, taxAmount: 0 });
        resultRaw.forEach(
          ({ amount, category }) =>
            ShopOrderPricingAdapter.log(`Order Pricing Calculation -> ${category} ${amount}`),
          resultRaw,
        );
        return resultRaw;
      },
      resultSheet: () => resultSheet,
    };
  },
};

```

- **isActiveFor(context: [OrderPricingAdapterContext](https://docs.unchained.shop/types/interfaces/orders_pricing.OrderPricingAdapterContext.html))**: Used to activate or de-active a particular order price plugin based on the current context of the order or any other business rule.
- **calculate**: is where the actual calculation of the order price is done based on the calculation items defined for the adapter.
- **resultSheet**: return the price sheet items that are  applied on the price adapter.


```typescript
import {OrderPriceDirector} from '@unchainedshop/core-orders'

OrderPriceDirector.registerAdapter(ShopOrderPricingAdapter)
```