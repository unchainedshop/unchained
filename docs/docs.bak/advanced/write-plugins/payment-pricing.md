---
sidebar_position: 7
sidebar_label: Payment Pricing
title: Payment Pricing
---
:::info
Add a payment pricing plugin
:::


Payment pricing adapter gives you control on how payments are calculated shop wide for all orders made in the shop. like giving discount for people that use card payment method, adding commission etc. in order to configure payment pricing for a shop, you have to implement [IPaymentPricingAdapter](https://docs.unchained.shop/types/types/payments_pricing.IPaymentPricingAdapter.html) and register the payment adapter on the global payment pricing director that implements the [IPaymentPricingDirector](https://docs.unchained.shop/types/types/payments_pricing.IPaymentPricingDirector.html).

There can be multiple payment price adapter configured for a shop and all of them are executed based on there `orderIndex` value. adapter with lower `orderIndex` values are executed first.


Below is sample payment pricing adapter implementation that will calculate prices for a shop. it's will add commission fees that use payment provider that have `SHOP_COMMISSION` on there configuration.

```typescript

import {
  IPaymentPricingAdapter,
  PaymentPricingAdapterContext,
  IPaymentPricingSheet,
  PaymentPricingCalculation,
} from '@unchainedshop/core';

const TRANSACTION_FEE = 29;

export const ShopCommission: IPaymentPricingAdapter = {
  key: 'Shop.pricing.commission',
  version: '1.0.0',
  label: 'Shop Fee',
  orderIndex: 2,

  isActivatedFor: (context: PaymentPricingAdapterContext): boolean => {
    return true;
  },

  actions: (params: {
    calculationSheet: IPaymentPricingSheet;
    context: PaymentPricingAdapterContext;
    discounts: Discount[];
  }): Promise<PaymentPricingCalculation[]> => {
    const calculation: PaymentPricingCalculation[] = [];
    const resultSheet = PaymentPricingSheet({ currency });
    const { context } = params;

    return {
      calculate: async () => {
        const rate = context.provider.configuration?.reduce((current, item) => {
          if (item.key === 'SHOP_COMMISSION') return parseInt(item.value, 10) / 100;
          return current;
        }, 0);

        if (rate > 0 && context.order) {
          const orderPositions = await context.modules.orders.positions.findOrderPositions({
            orderId: context.order._id,
          });

          const totalValueOfGoods = orderPositions.reduce((current, orderPosition) => {
            const pricing = ProductPricingSheet({
              calculation: orderPosition.calculation,
              currency: context.order.currency,
              quantity: orderPosition.quantity,
            });
            const items = pricing.gross();
            return current + items;
          }, 0);

          const amount = Math.round(totalValueOfGoods * rate + TRANSACTION_FEE);
          resultSheet.addFee({
            amount,
            isNetPrice: false,
            isTaxable: false,
            meta: { adapter: ShopCommission.key },
          });
          resultSheet.resultSheet().addDiscount({
            amount: amount * -1,
            isNetPrice: false,
            isTaxable: false,
            discountId: 'ch.Shop.discount.remove-Shop-fee',
            meta: { adapter: ShopCommission.key },
          });
        }
        const resultRaw = resultSheet.getRawPricingSheet();
        resultRaw.forEach(({ amount, category }) =>
          this.log(`Payment Calculation -> ${category} ${amount}`),
        );
        return resultRaw;
      },
      resultSheet: () => resultSheet,
    };
  },
};

```

- **isActiveFor(context: [PaymentPricingAdapterContext](https://docs.unchained.shop/types/interfaces/payments_pricing.PaymentPricingAdapterContext.html))**: Used to activate or de-active a particular payment price plugin based on the current context of the order or any other business rule.
- **calculate**: is where the actual calculation of the payment price is done based on the calculation items defined for the adapter.
- **resultSheet**: return the price sheet items that are  applied on the price adapter.

## Registering payment pricing adapters

In order to register your custom payment pricing adapter for use, you need to register it to the global payment pricing director

```typescript
import { PaymentPricingDirector } from '@unchainedshop/core-payment'

PaymentPricingDirector.registerAdapter(ShopCommission);
```
