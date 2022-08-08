---
title: "Payment plugins"
description: Customize Payment
---


## PaymentPricingAdapter

Payment pricing adapter gives you control on how payments are calculated shop wide for all orders made in the shop. like giving discount for people that use card payment method, adding commission etc. in order to configure payment pricing for a shop, you have to implement [IPaymentPricingAdapter](https://docs.unchained.shop/types/types/payments_pricing.IPaymentPricingAdapter.html) and register the payment adapter on the global payment pricing director that implements the [IPaymentPricingDirector](https://docs.unchained.shop/types/types/payments_pricing.IPaymentPricingDirector.html).

There can be multiple payment price adapter configured for a shop and all of them are executed based on there `orderIndex` value. adapter with lower `orderIndex` values are executed first.


Below is sample payment pricing adapter implementation that will calculate prices for a shop. it's will add commission fees that use payment provider that have `SHOP_COMMISSION` on there configuration.

```typescript

import {
  IPaymentPricingAdapter,
  PaymentPricingAdapterContext,
  IPaymentPricingSheet,
  PaymentPricingCalculation,
} from '@unchainedshop/types/payments.pricing';

import { LogOptions } from '@unchainedshop/types/logs';
import { Discount } from '@unchainedshop/types/discount';

const TRANSACTION_FEE = 29;

export const ShopCommission: IPaymentPricingAdapter = {
  key: 'Shop.pricing.commission',
  version: '1.0',
  label: 'Shop Fee',
  orderIndex: 2,

  isActivatedFor: (context: PaymentPricingAdapterContext): boolean => {
    return true;
  },
  log(message: string, options?: LogOptions): void {
    console.log(message);
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
            const pricing = context.modules.orders.positions.pricingSheet(
              orderPosition,
              context.order.currency,
              params.context,
            );
            const items = pricing.gross() - pricing.discountSum();
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
      getContext: (): PaymentPricingAdapterContext => params.context,
      resultSheet: () => resultSheet,
      getCalculation: (): PaymentPricingCalculation[] => calculation,
    };
  },
};

```

- **isActiveFor(context: [PaymentPricingAdapterContext](https://docs.unchained.shop/types/interfaces/payments_pricing.PaymentPricingAdapterContext.html))**: Used to activate or de-active a particular payment price plugin based on the current context of the order or any other business rule.
- **calculate**: is where the actual calculation of the payment price is done based on the calculation items defined for the adapter.
- **getContext**: returns the current payment price plugin context.
- **resultSheet**: return the price sheet items that are  applied on the price adapter.

## Registering payment pricing adapters

In order to register your custom payment pricing adapter for use, you need to register it to the global payment pricing director

```typescript
import { PaymentPricingDirector } from '@unchainedshop/core-payment'

PaymentPricingDirector.registerAdapter(ShopCommission);
```

## PaymentAdapter

You can add multiple payment method types to a shop such as `CARD` & `INVOICE` but before you can start accepting payment you need to add a payment adapter by implementing the [IPaymentAdapter](https://docs.unchained.shop/types/types/payments.IPaymentAdapter.html) and registering it to the global Payment director that implements the [IPaymentDirector](https://docs.unchained.shop/types/types/payments.IPaymentDirector.html).

Below is an example implementation of `Pre-Paid INVOICE` payment provider type that will require a manual confirmation of order payment 

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
  key: 'ch.Shop.payment',
  label: 'Shop Payment',
  version: '1.0',

  initialConfiguration: PaymentConfiguration =  [],

  typeSupported: (type: PaymentProviderType): boolean => {
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

      configurationError: (transactionContext?: any): PaymentError => {
        return null;
      },
      isActive: (transactionContext?: any): boolean => {
        return true;
      },

      isPayLaterAllowed: (transactionContext?: any): boolean => {
        return false;
      },
      charge: async (transactionContext?: any):Promise<PaymentChargeActionResult | false> => {
        return false;
      },
      register: async (transactionContext?: any): boolean => {
        return {
          token: '',
        };
      },

      sign: async (transactionContext?: any): Promise<string> => {
        return null;
      },

      validate: async (token?: any): Promise<boolean> => {
        return false;
      },

      cancel: async (transactionContext?: any): Promise<boolean> => {
        return false;
      },

      confirm: async (transactionContext?: any) => {
        return false;
      },

    };
  },
};


```
 - **typeSupported: (type: [PaymentProviderType](https://docs.unchained.shop/types/enums/payments.PaymentProviderType.html))**: Defines what the payment adapter represents.
 - **configurationError**: returns any error that occurred for a payment adapter, could be missing required environment  variable for example
 - **isActive**: Used to disable payment adapter for a given context
 - **isPayLaterAllowed**: if you return true an order can be complete without depending on a payment status if returned false payment needs to be completed for a successful completion of an order
 - **register**: Registers a payment provider
 - **sign**: Used to authenticate user information using there submitted payment provider credential
 - **validate**
 - **cancel**: cancels payment 
 - **charge: async (transactionContext?: any):Promise<[PaymentChargeActionResult](https://docs.unchained.shop/types/types/payments.PaymentChargeActionResult.html) | false>**: used for adding charge to the payment provider selected, for example it might be calling the charge API endpoint of a specific card payment provider.
 - **charge**: If you return true, the status will be changed to PAID, if you return false, the order payment status stays the same but the order status might change if you throw an error, you cancel the checkout process




## Registering payment adapter


In order to register your custom payment adapter for use, you need to register it to the global payment director

```typescript
import { PaymentDirector } from '@unchainedshop/core-payment'

PaymentDirector.registerAdapter(ShopPayment);
```