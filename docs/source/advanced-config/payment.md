---
title: "Payment plugins"
description: Customize Payment
---


```typescript
import type { IPaymentAdapter } from '@unchainedshop/types/payments';
import {
  PaymentDirector,
  PaymentAdapter,
  PaymentProviderType,
  PaymentError,
} from '@unchainedshop/core-payment';
import { Context } from '@unchainedshop/types/api';

const ShopPayment: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'ch.Shop.payment',
  label: 'Shop Payment',
  version: '1.0',

  initialConfiguration: PaymentConfiguration =  [],

  typeSupported: (type: PaymentProviderType) => {
    return type === PaymentProviderType.INVOICE;
  },

  actions: (params: {
    config: PaymentConfiguration;
    paymentContext: PaymentContext & {
      paymentProviderId: string;
      paymentProvider: PaymentProvider;
    };
    context: Context;
  }): IPaymentActions => {
    const { context, paymentContext } = params;
    const { order } = paymentContext;
    const { modules } = context as Context;

    return {
      ...PaymentAdapter.actions(params),

      configurationError: (transactionContext?: any): PaymentError => {
        return null;
      },

      isActive: (transactionContext?: any): boolean => {
        return true;
      },

      isPayLaterAllowed: (transactionContext?: any) => {
        return false;
      },

      async charge(transactionContext?: any):Promise<PaymentChargeActionResult | false> {
        

        return {  };
      },
    };
  },
};

```


```typescript

PaymentDirector.registerAdapter(ShopPayment);

```




### Payment Price Adapter

```typescript

import { IPaymentPricingAdapter } from "@unchainedshop/types/payments.pricing";
import {
  PaymentPricingAdapter,
  PaymentPricingDirector,
} from "@unchainedshop/core-payment";


const TRANSACTION_FEE = 29;

export const ShopCommission: IPaymentPricingAdapter = {
  ...PaymentPricingAdapter,

  key: "Shop.pricing.commission",
  version: "1.0",
  label: "Shop Fee",
  orderIndex: 2,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = PaymentPricingAdapter.actions(params);
    const { context } = params;

    return {
      ...pricingAdapter,
      calculate: async () => {
        const rate = context.provider.configuration?.reduce((current, item) => {
          if (item.key === 'SHOP_COMMISSION')
            return parseInt(item.value, 10) / 100;
          return current;
        }, 0);

        if (rate > 0 && context.order) {
          const orderPositions =
            await context.modules.orders.positions.findOrderPositions({
              orderId: context.order._id,
            });

          const totalValueOfGoods = orderPositions.reduce(
            (current, orderPosition) => {
              const pricing = context.modules.orders.positions.pricingSheet(
                orderPosition,
                context.order.currency,
                params.context
              );
              const items = pricing.gross() - pricing.discountSum(); 
              return current + items;
            },
            0
          );

          const amount = Math.round(totalValueOfGoods * rate + TRANSACTION_FEE);
          pricingAdapter.resultSheet().addFee({
            amount,
            isNetPrice: false,
            isTaxable: false,
            meta: { adapter: ShopCommission.key },
          });
          pricingAdapter.resultSheet().addDiscount({
            amount: amount * -1,
            isNetPrice: false,
            isTaxable: false,
            discountId: "ch.Shop.discount.remove-Shop-fee",
            meta: { adapter: ShopCommission.key },
          });
        }

        return pricingAdapter.calculate();
      },
    };
  },
};



```


```typescript

PaymentPricingDirector.registerAdapter(ShopCommission);

```